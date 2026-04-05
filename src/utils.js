export const arrayIsEqual = (a, b) => a.length === b.length && a.every((e, i) => e === b[i])
export const floatIsEqual = (a, b) => Math.abs(a - b) < 0.0001
export const mostCommon = arr => {
    const counts = arr.reduce((curr, elem) => (curr.set(elem, (curr.get(elem) || 0) + 1), curr), new Map())
    let maxCount = 0, maxElem
    for (const [elem, count] of counts.entries()) {
        if (count > maxCount) {
            maxCount = count
            maxElem = elem
        }
    }
    return maxElem
}
export const crossIntervals = (i1, i2) => {
    return (i1[0] >= i2[0] && i1[0] <= i2[1]) || (i1[1] >= i2[0] && i1[1] <= i2[1]) || (i1[0] <= i2[0] && i1[1] >= i2[1])
}