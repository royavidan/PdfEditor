import { describe, it, expect, beforeAll } from 'vitest'
import { compactMods, tryLoadMods } from './file-logic'
import { readPlainFile } from '../../test-utils/utils'
import type { FileData } from '../../context/file-context'
import type { Modification } from '../../context/modification-context'

describe('file-logics', () => {
    let data: FileData

    beforeAll(async () => data = await readPlainFile('empty.pdf'))

    it('empty', async () => {
        const loadedContent = tryLoadMods(data)
        expect(loadedContent.modList).toBeNull()
        expect(loadedContent.data.byteLength).toEqual(data.byteLength)
    })

    it('valid', async () => {
        const modList: [Modification] = [{
            id: 0,
            page: 0,
            value: 2,
            position: { x: 10, y: 10 },
            bloon: {
                left: 100,
                right: 100,
                top: 100,
                bottom: 100,
                content: '1',
                measurement: 'LINEAR'
            }
        }]

        const compactData = await new Response(compactMods(data, modList)).arrayBuffer()
        const loadedContent = tryLoadMods(compactData)
        expect(loadedContent.modList).toEqual(modList)
        expect(loadedContent.data.byteLength).toBeLessThan(compactData.byteLength)
        expect(loadedContent.data.byteLength).toBe(data.byteLength)
    })

    it('invalid', async () => {
        const modList: [Omit<Modification, 'value'>] = [{
            id: 0,
            page: 0,
            position: { x: 10, y: 10 },
            bloon: {
                left: 100,
                right: 100,
                top: 100,
                bottom: 100,
                content: '1',
                measurement: 'LINEAR'
            }
        }]

        const compactData = await new Response(compactMods(data, modList as unknown as Modification[])).arrayBuffer()
        const loadedContent = tryLoadMods(compactData)
        expect(loadedContent.modList).toBeNull()
        expect(loadedContent.data.byteLength).toBe(compactData.byteLength)
    })
})