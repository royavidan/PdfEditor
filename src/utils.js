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
 * @param {number | undefined} epsilon The tolerance.
 * @returns {boolean} Whether the numbers are close enough.
 */
export const floatIsEqual = (a, b, epsilon = 0.0001) => Math.abs(a - b) < epsilon
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

/**
 * Returns the only element that matches the predicate (or `undefined` there is none or more than one).
 * @template T The array elements type.
 * @param {readonly T[]} arr The array.
 * @param {(value: T, index: number, obj: readonly T[]) => boolean} pred find calls predicate once for each element of the array, in ascending
     * order, until it finds one where predicate returns true.
 * @returns {T | undefined} The only element that matches the predicate, if such exists.
 */
export const findOne = (arr, pred) => {
    const index = arr.findIndex(pred)
    return index >= 0 && arr.findIndex((value, i, obj) => i > index && pred(value, i, obj)) === -1 ? arr[index] : undefined
}

/**
 * Returns the index of the only element that matches the predicate (or `-1` there is none or more than one).
 * @template T The array elements type.
 * @param {readonly T[]} arr The array.
 * @param {(value: T, index: number, obj: readonly T[]) => boolean} pred find calls predicate once for each element of the array, in ascending
     * order, until it finds one where predicate returns true.
 * @returns {number} The index of the only element that matches the predicate, if such exists.
 */
export const findOneIndex = (arr, pred) => {
    const index = arr.findIndex(pred)
    return index >= 0 && arr.findIndex((value, i, obj) => i > index && pred(value, i, obj)) === -1 ? index : -1
}

/**
 * Translate a position by a rotation angle.
 * @param {number} angle The rotation angle, either 0, 90, 180 or 270.
 * @param {number} x The x-axis position.
 * @param {number} y The y-axis position.
 * @param {number} width The page width.
 * @param {number} height The page height.
 * @returns {{x: number, y: number}} The translated position.
 */
export const translatePos = (angle, x, y, width, height) => {
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

/**
 * Get positive angle.
 * @param {number} angle The angle (in degrees).
 * @returns {number} The positive angle.
 */
export const getPositiveAngle = angle => ((angle % 360) + 360) % 360