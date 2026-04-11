/**
 * Compares arrays element by element.
 * @template T The element type.
 * @param {readonly T[]} a The first array.
 * @param {readonly T[]} b The second array.
 * @returns {boolean} Whether all the elements are equal.
 */
export const arrayIsEqual = (a, b) => a.length === b.length && a.every((e, i) => e === b[i])
/**
 * Compares floating-points numbers with a tolerance.
 * @param {number} a The first number.
 * @param {number} b The second number.
 * @returns {boolean} Whether the numbers are close enough.
 */
export const floatIsEqual = (a, b) => Math.abs(a - b) < 0.0001
/**
 * Returns the element that is found most times in the array.
 * @template T The element type.
 * @param {readonly T[]} arr The array.
 * @returns {T} The most common element.
 */
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

/**
 * Check whether 2 single-axis intervals intersect.
 * @param {[number, number]} i1 The first interval.
 * @param {[number, number]} i2 The second interval.
 * @returns {boolean} Whether the intervals intersect.
 */
export const crossIntervals = (i1, i2) => {
    return (i1[0] >= i2[0] && i1[0] <= i2[1]) || (i1[1] >= i2[0] && i1[1] <= i2[1]) || (i1[0] <= i2[0] && i1[1] >= i2[1])
}