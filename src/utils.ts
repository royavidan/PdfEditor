import type { Border, Predicate, SkewBorder } from './types'

export const arrayIsEqual = <T,>(a: ArrayLike<T>, b: ArrayLike<T>) => {
    if (Array.isArray(a)) return a.length === b.length && a.every((e, i) => e === b[i])
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
    return true
}

export const floatIsEqual = (a: number, b: number, epsilon: number = 0.0001) => Math.abs(a - b) < epsilon

export const mostCommon = <T,>(arr: readonly T[]) => {
    // eslint-disable-next-line no-sequences
    const counts = arr.reduce((curr, elem) => (curr.set(elem, (curr.get(elem) || 0) + 1), curr), new Map<T, number>())
    let maxCount = 0, maxElem
    for (const [elem, count] of counts.entries()) {
        if (count > maxCount) {
            maxCount = count
            maxElem = elem
        }
    }
    return maxElem as T
}

type Interval<T = number> = [T, T]

export const crossIntervals = (i1: Interval, i2: Interval) => {
    return Math.max(i1[0], i2[0]) <= Math.min(i1[1], i2[1])
}

export const findOne = <T,>(arr: readonly T[], pred: ((value: T, index: number, obj: readonly T[]) => boolean)) => {
    const index = arr.findIndex(pred)
    return index >= 0 && arr.findIndex((value, i, obj) => i > index && pred(value, i, obj)) === -1 ? arr[index] : undefined
}

export const findOneIndex = <T,>(arr: readonly T[], pred: ((value: T, index: number, obj: readonly T[]) => boolean)) => {
    const index = arr.findIndex(pred)
    return index >= 0 && arr.findIndex((value, i, obj) => i > index && pred(value, i, obj)) === -1 ? index : -1
}

export const translatePos = (angle: number, x: number, y: number, width: number, height: number) => {
    switch (getPositiveAngle(angle)) {
        case 0:
            return { x, y }
        case 90:
            return { x: y, y: height - x }
        case 180:
            return { x: width - x, y: height - y }
        case 270:
            return { x: width - y, y: x }
        default:
            return { x, y }
    }
}

export const getPositiveAngle = (angle: number) => ((angle % 360) + 360) % 360

export const isInside = (inner: Border, outer: Border) => inner.left >= outer.left && inner.right <= outer.right && inner.top >= outer.top && inner.bottom <= outer.bottom

export const isInsideSkew = (border: SkewBorder): Predicate<Border> => {
    const center = { x: (border.diagonal[0].x + border.diagonal[1].x) / 2, y: (border.diagonal[0].y + border.diagonal[1].y) / 2 }
    const diaLen = Math.hypot(border.diagonal[1].x - border.diagonal[0].x, border.diagonal[1].y - border.diagonal[0].y), diaAngle = Math.atan2(border.diagonal[1].y - border.diagonal[0].y, border.diagonal[1].x - border.diagonal[0].x)
    const widthHalf = Math.abs(diaLen * Math.cos(diaAngle - border.angle)) / 2, heightHalf = Math.abs(diaLen * Math.sin(diaAngle - border.angle)) / 2
    const cos = Math.cos(border.angle), sin = Math.sin(border.angle)
    return inner => {
        const corners = [
            { x: inner.left, y: inner.top },
            { x: inner.right, y: inner.top },
            { x: inner.right, y: inner.bottom },
            { x: inner.left, y: inner.bottom }
        ]

        return corners.every(corner => {
            const p = { x: corner.x - center.x, y: corner.y - center.y }
            const rot = { x: p.x * cos + p.y * sin, y: -p.x * sin + p.y * cos }
            return rot.x >= -widthHalf && rot.x <= widthHalf && rot.y >= -heightHalf && rot.y <= heightHalf
        })
    }
}

export const replaceMany = (text: string, table: Record<string, string>) => {
    for (const [key, value] of Object.entries(table)) text = text.replaceAll(key, value)
    return text
}