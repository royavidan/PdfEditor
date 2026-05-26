import { describe, it, expect } from 'vitest'
import { arrayIsEqual, floatIsEqual, mostCommon, crossIntervals, findOne, findOneIndex, translatePos, getPositiveAngle, isInside, replaceMany } from './utils'

describe('arrayIsEqual', () => {
    it('simple - true', () => {
        expect(arrayIsEqual([1, 2, 3], [1, 2, 3])).toBe(true)
    })

    it('simple - false', () => {
        expect(arrayIsEqual([1, 2, 3], [1, 2, 4])).toBe(false)
    })

    it('length - false', () => {
        expect(arrayIsEqual([1, 2, 3], [1, 2])).toBe(false)
    })

    it('not array - true', () => {
        expect(arrayIsEqual(new Uint8Array([1, 2, 3]), new Uint8Array([1, 2, 3]))).toBe(true)
    })

    it('not array - false', () => {
        expect(arrayIsEqual(new Uint8Array([1, 2, 3]), new Uint8Array([1, 2, 4]))).toBe(false)
    })
})

describe('floatIsEqual', () => {
    it('simple - true', () => {
        expect(floatIsEqual(1, 1)).toBe(true)
    })

    it('simple - false', () => {
        expect(floatIsEqual(1, 2)).toBe(false)
    })

    it('epsilon - true', () => {
        expect(floatIsEqual(1, 1.1, 0.101)).toBe(true)
    })

    it('epsilon - false', () => {
        expect(floatIsEqual(1, 1.1, 0.01)).toBe(false)
    })
})

describe('mostCommon', () => {
    it('simple', () => {
        expect(mostCommon([1, 1, 1, 2, 2, 2, 3, 3, 3, 3])).toBe(3)
        expect(mostCommon(['a', 'a', 'a', 'b', 'b', 'b', 'c', 'c', 'c', 'c'])).toBe('c')
    })
})

describe('crossIntervals', () => {
    it('simple - true', () => {
        expect(crossIntervals([1, 3], [2, 4])).toBe(true)
    })

    it('simple - false', () => {
        expect(crossIntervals([1, 2], [4, 5])).toBe(false)
    })
})

describe('findOne', () => {
    const eq = <T,>(value: T) => (arg: T) => arg === value

    it('simple - exist', () => {
        expect(findOne([1, 2, 3, 4, 5], eq(3))).toBe(3)
    })

    it('simple - not exist', () => {
        expect(findOne([1, 2, 3, 4, 5], eq(6))).toBeUndefined()
    })
})

describe('findOneIndex', () => {
    const eq = <T,>(value: T) => (arg: T) => arg === value

    it('simple - exist', () => {
        expect(findOneIndex([1, 2, 3, 4, 5], eq(3))).toBe(2)
    })

    it('simple - not exist', () => {
        expect(findOneIndex([1, 2, 3, 4, 5], eq(6))).toBe(-1)
    })
})

describe('translatePos', () => {
    it('0 deg', () => {
        expect(translatePos(0, 30, 80, 100, 100)).toEqual({ x: 30, y: 80 })
    })

    it('90 deg', () => {
        expect(translatePos(90, 30, 80, 100, 100)).toEqual({ x: 80, y: 70 })
    })

    it('180 deg', () => {
        expect(translatePos(180, 30, 80, 100, 100)).toEqual({ x: 70, y: 20 })
    })

    it('270 deg', () => {
        expect(translatePos(270, 30, 80, 100, 100)).toEqual({ x: 20, y: 30 })
    })
})

describe('getPositiveAngle', () => {
    it('simple', () => {
        expect(getPositiveAngle(-360)).toBe(0)
        expect(getPositiveAngle(-270)).toBe(90)
        expect(getPositiveAngle(-180)).toBe(180)
        expect(getPositiveAngle(-90)).toBe(270)
        expect(getPositiveAngle(0)).toBe(0)
        expect(getPositiveAngle(90)).toBe(90)
        expect(getPositiveAngle(180)).toBe(180)
        expect(getPositiveAngle(270)).toBe(270)
        expect(getPositiveAngle(360)).toBe(0)
    })
})

describe('isInside', () => {
    it('simple - true', () => {
        expect(isInside({ left: 1, right: 2, top: 3, bottom: 4 }, { left: 0, right: 3, top: 2, bottom: 5 })).toBe(true)
    })

    it('simple - false', () => {
        expect(isInside({ left: 1, right: 2, top: 3, bottom: 4 }, { left: 0, right: 1, top: 2, bottom: 5 })).toBe(false)
    })
})

describe('replaceMany', () => {
    it('simple', () => {
        expect(replaceMany('abca', { a: 'A', B: 'O', c: 'C' })).toBe('AbCA')
    })
})