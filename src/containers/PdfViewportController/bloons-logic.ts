import { isInside, mostCommon, floatIsEqual, crossIntervals, findOne } from '../../utils'
import type { Data, Text } from '../../context/pdf-context'
import type { Border, Position } from '../../types'
import type { Bloon } from '../../context/modification-context'

type FilledText = Text & Position

const MEASUREMENT_CHAR_MAP: Record<string, string> = {
    '⌀': 'DIA',
    '↧': 'DEPTH'
}

export function fillBloon(border: Border, data: Data) {
    const bloonText = data.text.filter(t => isInside(t.border, border))
    const symbols = Object.fromEntries(Object.entries(data.symbols).map(e => [e[0], e[1].find(s => isInside(s, border))]).filter(e => e[1]))

    const bloon = border as Bloon
    //STEP 1: read text and find tolerances
    const mainAngle = mostCommon(bloonText.map(s => s.angle)) ?? 0
    let text = bloonText.filter(t => floatIsEqual(t.angle, mainAngle, 0.1) || t.plusminus).map(t => ({ ...t }) as FilledText)
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
                const matching = (base: FilledText, t: FilledText) => (base.x - t.x - t.width) < 5 && Math.abs(base.y - t.y) < 5
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
        }
    }

    while (!bloon.tolerance) {
        const pmText = findOne(text, t => t.plusminus as boolean)
        if (!pmText) break
        const str = findOne(text, t => t.x < pmText.x && t.x + t.width > pmText.x + pmText.width && floatIsEqual(t.y, pmText.y, 1))
        if (!str) break
        const lastSpaceIndex = str.str.lastIndexOf(' ')
        if (lastSpaceIndex === -1) break
        const tolerance = Number(str.str.slice(lastSpaceIndex + 1))
        if (Number.isNaN(tolerance)) break
        bloon.tolerance = { '+': tolerance, '-': tolerance }
        text = [...text.filter(t => !t.plusminus)]
        text.find(t => t.str === str.str)!.str = str.str.slice(0, lastSpaceIndex)
    }
    
    text.sort((a, b) => a.x - b.x)
    bloon.content = text.map(t => t.str).reduce((a, b) => a + (a.endsWith('R') || (/[a-zA-Z-]/.test(b[0]) && b !== 'x') ? ' ' : '') + b, '').trim()
    bloon.content = bloon.content.replaceAll(/[()*]/g, '')
    bloon.content = bloon.content.replace('°°', '°')
    const plusminus = /±([\d.]+)/.exec(bloon.content)
    if (plusminus) {
        bloon.tolerance = { '+': plusminus[1], '-': plusminus[1] }
        bloon.content = (bloon.content.slice(0, plusminus.index) + bloon.content.slice(plusminus.index + plusminus[0].length)).trim()
    }

    //STEP 2: find measurement
    const measurementMatch = Object.entries(MEASUREMENT_CHAR_MAP).find(e => bloon.content.includes(e[0]))
    if (measurementMatch) {
        bloon.measurement = measurementMatch[1]
        bloon.content = bloon.content.replaceAll(measurementMatch[0], '')
    }
    else bloon.measurement = (function () {
        const txt = bloon.content.replaceAll(' ', '')
        const words = bloon.content.split(/[-\d\s]/)
        const symbol = Object.keys(symbols).find(sym => sym !== 'dia')
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

        if (symbols.dia) return 'DIA'

        return 'LINEAR'
    })()

    return bloon
}
