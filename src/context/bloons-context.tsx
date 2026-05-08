import React, { useState, createContext } from 'react'
import { crossIntervals, floatIsEqual, mostCommon } from '../utils'
import type { ContextProvider, Position } from '../types'
import type { Text, Symbol, SymbolType } from './pdf-context'

declare global {
    export interface BasicBloon {
        id: number
        left: number
        right: number
        top: number
        bottom: number
        text: Text[]
        symbols: Record<SymbolType, Symbol | undefined>
    }

    export interface Bloon extends Omit<BasicBloon, 'text' | 'symbols'> {
        content: string
        measurement: string
        tolerance?: {
            '+': number | string
            '-': number | string
        }
    }
}

export interface BloonsContext {
    bloons: Record<number, Bloon>
    fillBloon(bloon: BasicBloon): Bloon
    addBloon(id: number, bloon: Bloon): void
    removeBloon(id: number): void
    insertBloon(id: number, bloon: Bloon): void
    modifyBloon(id: number, mod: Partial<Bloon>): void
    resetBloons(): void
}

export const BloonsContext = createContext({
    bloons: {},
    fillBloon: (bloon: BasicBloon) => bloon as unknown as Bloon,
    addBloon: () => { },
    removeBloon: () => { },
    insertBloon: () => { },
    modifyBloon: () => { },
    resetBloons: () => { }
} as BloonsContext)

type FilledText = Text & Position

function fillBloon(bloon: BasicBloon) {
    const b = bloon as unknown as Bloon
    //STEP 1: read text and find tolerances
    const mainAngle = mostCommon(bloon.text.map(s => s.angle)) ?? 0
    let text = bloon.text.filter(t => floatIsEqual(t.angle, mainAngle) || t.plusminus) as FilledText[]
    // text.sort(floatIsEqual(mainAngle, -Math.PI / 2) ? ((a, b) => b.top - a.top) : ((a, b) => a.left - b.left))

    const cosA = Math.cos(mainAngle), sinA = Math.sin(mainAngle)

    text.forEach(t => {
        const x = t.left, y = t.bottom
        t.x = x * cosA + y * sinA
        t.y = -x * sinA + y * cosA
    })

    const angleBetween = (a: Text, b: Text) => Math.atan2((a.bottom + a.top - b.bottom - b.top) / 2, (a.right - a.left + b.right - b.left) / 2)

    for (let i = 0; !b.tolerance && i < text.length; i++) {
        for (let j = i + 1; j < text.length; j++) {
            let top = text[i], bottom = text[j]
            if (top.y > bottom.y) [top, bottom] = [bottom, top]

            if (!floatIsEqual(angleBetween(top, bottom), top.angle, 0.1) && !Number.isNaN(Number(top.str)) && !Number.isNaN(Number(bottom.str)) && crossIntervals([top.x, top.x + top.width], [bottom.x, bottom.x + bottom.width])) {
                const currentText = text
                const indexes = [i, j], plusminus = currentText.map((_, i) => i).filter(i => '+-'.includes(currentText[i].str))
                let topText = top.str, bottomText = bottom.str, match
                const matching = (base: FilledText, t: FilledText) => (base.x - t.x - t.width) < 5 && Math.abs(base.y - t.y) < 5
                if (!'+-'.includes(topText[0]) && topText !== '0' && undefined !== (match = plusminus.find(t => matching(top, currentText[t])))) {
                    if (currentText[match].str === '-') topText = currentText[match].str + topText
                    indexes.push(match)
                }
                if (!'+-'.includes(bottomText[0]) && bottomText !== '0' && undefined !== (match = plusminus.find(t => matching(bottom, currentText[t])))) {
                    if (currentText[match].str === '-') bottomText = currentText[match].str + bottomText
                    indexes.push(match)
                }
                b.tolerance = { '+': topText, '-': bottomText }
                text = text.filter((_, index) => !indexes.includes(index))
                break
            }
            
            let left = text[i], right = text[j]
            if (left.x > right.x) [left, right] = [right, left]
            if (!floatIsEqual(angleBetween(left, right), left.angle, 0.1) && !Number.isNaN(Number(left.str)) && !Number.isNaN(Number(right.str)) && crossIntervals([left.y, left.y + left.height], [right.y, right.y + right.height])) {
                const currentText = text
                const indexes = [i, j], plusminus = currentText.map((_, i) => i).filter(i => '+-'.includes(currentText[i].str))
                let leftText = left.str, rightText = right.str, match
                const matching = (base: FilledText, t: FilledText) => (base.y - t.y - t.height) < 5 && Math.abs(base.x - t.x) < 5
                if (!'+-'.includes(leftText[0]) && leftText !== '0' && undefined !== (match = plusminus.find(t => matching(left, currentText[t])))) {
                    if (currentText[match].str === '-') leftText = currentText[match].str + leftText
                    indexes.push(match)
                }
                if (!'+-'.includes(rightText[0]) && rightText !== '0' && undefined !== (match = plusminus.find(t => matching(right, currentText[t])))) {
                    if (currentText[match].str === '-') rightText = currentText[match].str + rightText
                    indexes.push(match)
                }
                b.tolerance = { '+': leftText, '-': rightText }
                text = text.filter((_, index) => !indexes.includes(index))
                break
            }
        }
    }

    text.sort((a, b) => floatIsEqual(a.x, b.x) ? (b.y - a.y) : (a.x - b.x))
    b.content = text.map(t => t.str).reduce((a, b) => a + (a.endsWith('R') || (/[a-zA-Z-]/.test(b[0]) && b !== 'x') ? ' ' : '') + b, '').trim()
    b.content = b.content.replaceAll('*', '')
    let plusminus = /±([\d.]+)/.exec(b.content)
    if (plusminus) {
        b.tolerance = { '+': plusminus[1], '-': plusminus[1] }
        b.content = (b.content.slice(0, plusminus.index) + b.content.slice(plusminus.index + plusminus[0].length)).trim()
    }

    //STEP 2: find measurement
    b.measurement = (function () {
        const txt = b.content.replaceAll(' ', '')
        const words = b.content.split(' ')
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

    b.content = b.content.replace('°°', '°')

    //@ts-ignore
    delete bloon.text
    //@ts-ignore
    delete bloon.symbols

    return b
}

export default (({ children }) => {
    const [bloons, setBloons] = useState<Record<number, Bloon>>({})

    const addBloon: BloonsContext['addBloon'] = (id, bloon) => setBloons(bloons => ({ ...bloons, [id]: bloon }))
    // eslint-disable-next-line eqeqeq
    const removeBloon: BloonsContext['removeBloon'] = id => setBloons(bloons => Object.fromEntries(Object.entries(bloons).filter(e => e[0] !== id.toString()).map(e => {
        if (e[1].id > bloons[id].id) e[1].id--
        return e
    })))
    const insertBloon: BloonsContext['insertBloon'] = (id, bloon) => setBloons(bloons => ({ ...Object.fromEntries(Object.entries(bloons).map(e => {
        if (e[1].id >= bloon.id) e[1].id++
        return e
    })), [id]: bloon }))
    const modifyBloon: BloonsContext['modifyBloon'] = (id, mod) => setBloons(bloons => ({ ...bloons, [id]: { ...bloons[id], ...mod } }))
    const resetBloons: BloonsContext['resetBloons'] = () => setBloons({})

    return (
        <BloonsContext.Provider
            value={{ bloons, fillBloon, addBloon, removeBloon, insertBloon, modifyBloon, resetBloons }}
        >
            {children}
        </BloonsContext.Provider>
    )
}) as ContextProvider
