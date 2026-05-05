import React, { useState, createContext } from 'react'
import { crossIntervals, floatIsEqual, mostCommon } from '../utils'

export const BloonsContext = createContext({
    bloons: {},
    fillBloon: () => { },
    addBloon: () => { },
    removeBloon: () => { },
    modifyBloon: () => { },
    resetBloons: () => { }
})

function fillBloon(bloon) {
    //STEP 1: read text and find tolerances
    const mainAngle = mostCommon(bloon.text.map(s => s.angle)) ?? 0
    let text = bloon.text.filter(t => floatIsEqual(t.angle, mainAngle))
    // text.sort(floatIsEqual(mainAngle, -Math.PI / 2) ? ((a, b) => b.top - a.top) : ((a, b) => a.left - b.left))

    const cosA = Math.cos(mainAngle), sinA = Math.sin(mainAngle)

    text.forEach(t => {
        const x = t.left, y = t.bottom
        t.x = x * cosA + y * sinA
        t.y = -x * sinA + y * cosA
    })

    for (let i = 0; !bloon.tolerance && i < text.length; i++) {
        for (let j = i + 1; j < text.length; j++) {
            let top = text[i], bottom = text[j]
            if (top.y > bottom.y) [top, bottom] = [bottom, top]

            if (!Number.isNaN(Number(top.str)) && !Number.isNaN(Number(bottom.str)) && crossIntervals([top.x, top.x + top.width], [bottom.x, bottom.x + bottom.width])) {
                const currentText = text
                const indexes = [i, j], plusminus = currentText.map((_, i) => i).filter(i => '+-'.includes(currentText[i].str))
                let topText = top.str, bottomText = bottom.str, match
                const matching = (base, t) => (base.x - t.x - t.width) < 5 && Math.abs(base.y - t.y) < 5
                if (!'+-'.includes(topText[0]) && topText !== '0' && undefined !== (match = plusminus.find(t => matching(top, currentText[t])))) {
                    if (currentText[match].str === '-') topText = currentText[match].str + topText
                    indexes.push(match)
                }
                if (!'+-'.includes(bottomText[0]) && bottomText !== '0' && undefined !== (match = plusminus.find(t => matching(bottom, currentText[t])))) {
                    if (currentText[match].str === '-') bottomText = currentText[match].str + bottomText
                    indexes.push(match)
                }
                bloon.tolerance = { '+': topText, '-': bottomText }
                text = text.filter((_, index) => !indexes.includes(index))
                break
            }
            
            let left = text[i], right = text[j]
            if (left.x > right.x) [left, right] = [right, left]
            if (!Number.isNaN(Number(left.str)) && !Number.isNaN(Number(right.str)) && crossIntervals([left.y, left.y + left.height], [right.y, right.y + right.height])) {
                const currentText = text
                const indexes = [i, j], plusminus = currentText.map((_, i) => i).filter(i => '+-'.includes(currentText[i].str))
                let leftText = left.str, rightText = right.str, match
                const matching = (base, t) => (base.y - t.y - t.height) < 5 && Math.abs(base.x - t.x) < 5
                if (!'+-'.includes(leftText[0]) && leftText !== '0' && undefined !== (match = plusminus.find(t => matching(left, currentText[t])))) {
                    if (currentText[match].str === '-') leftText = currentText[match].str + leftText
                    indexes.push(match)
                }
                if (!'+-'.includes(rightText[0]) && rightText !== '0' && undefined !== (match = plusminus.find(t => matching(right, currentText[t])))) {
                    if (currentText[match].str === '-') rightText = currentText[match].str + rightText
                    indexes.push(match)
                }
                bloon.tolerance = { '+': leftText, '-': rightText }
                text = text.filter((_, index) => !indexes.includes(index))
                break
            }
        }
    }

    text.sort((a, b) => floatIsEqual(a.x, b.x) ? (b.y - a.y) : (a.x - b.x))
    bloon.content = text.map(t => t.str).reduce((a, b) => a + (a.endsWith('R') || (/[a-zA-Z-]/.test(b[0]) && b !== 'x') ? ' ' : '') + b, '').trim()
    bloon.content = bloon.content.replaceAll('*', '')
    let plusminus = /±([\d.]+)/.exec(bloon.content)
    if (plusminus) {
        bloon.tolerance = { '+': plusminus[1], '-': plusminus[1] }
        bloon.content = (bloon.content.slice(0, plusminus.index) + bloon.content.slice(plusminus.index + plusminus[0].length)).trim()
    }

    //STEP 2: find measurement
    bloon.measurement = (function () {
        const txt = bloon.content.replaceAll(' ', '')
        const words = bloon.content.split(' ')
        let symbol = Object.keys(bloon.symbols).find(sym => sym !== 'dia')
        if (symbol) return symbol.toUpperCase()

        if (txt.endsWith('°')) {
            const m = txt.match(/([\d.]+x)?([\d.]+)°/)
            if (m) {
                const times = m[1] ? Number(m[1].slice(0, -1)) : 1, degrees = Number(m[2])
                return times < 2 && degrees === 45 ? 'CHAMFER' : 'ANGULAR'
            }
        }

        if (words.includes('R')) return 'RADIUS'

        if (['M', 'MF', 'UNC', 'UNF', 'UNEF', 'VNJF', 'G', 'BA', 'BSF', 'H-C', 'Pg', 'TR', 'W', 'Batress'].find(s => words.includes(s)))
            return 'TAP'

        if (txt.startsWith('Ra') || txt.startsWith('Rz') || /^N1?\d/.test(txt)) return 'SURFACE FINISH'

        if (bloon.symbols.dia) return 'DIA'

        return 'LINEAR'
    })()

    return bloon
}

export default ({ children }) => {
    const [bloons, setBloons] = useState([])
    global.bloons = bloons

    const addBloon = (id, bloon) => setBloons(bloons => ({ ...bloons, [id]: bloon }))
    // eslint-disable-next-line eqeqeq
    const removeBloon = id => setBloons(bloons => Object.fromEntries(Object.entries(bloons).filter(e => e[0] != id)))
    const modifyBloon = (id, mod) => setBloons(bloons => ({ ...bloons, [id]: { ...bloons[id], ...mod } }))
    const resetBloons = () => setBloons({})

    return (
        <BloonsContext.Provider
            value={{ bloons, fillBloon, addBloon, removeBloon, modifyBloon, resetBloons }}
        >
            {children}
        </BloonsContext.Provider>
    )
}
