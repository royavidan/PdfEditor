export const arrayIsEqual = <T,>(a: readonly T[], b: readonly T[]) => a.length === b.length && a.every((e, i) => e === b[i])

export const floatIsEqual = (a: number, b: number, epsilon: number = 0.0001) => Math.abs(a - b) < epsilon

export const mostCommon = <T,>(arr: readonly T[]) => {
    // eslint-disable-next-line no-sequences
    const counts = arr.reduce((curr, elem) => (curr.set(elem, (curr.get(elem) || 0) + 1), curr), new Map())
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
    return (i1[0] >= i2[0] && i1[0] <= i2[1]) || (i1[1] >= i2[0] && i1[1] <= i2[1]) || (i1[0] <= i2[0] && i1[1] >= i2[1])
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