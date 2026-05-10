import { readJSONFile } from '../../test-utils/utils'
import { fillBloon } from './bloons-logic'
import type { Modification } from '../../context/modification-context'
import type { Data } from '../../context/pdf-context'

const TESTS = 1

describe('PDF Worker', () => {
    for (let i = 1; i <= TESTS; i++) {
        it.concurrent(`PDF Worker - symbols ${i}`, async () => {
            const data = await readJSONFile(i, 'data') as Data[]
            const modList = await readJSONFile(i, 'modList') as Modification[]

            for (const mod of modList) {
                const basicBloon = {
                    left: mod.bloon.left,
                    right: mod.bloon.right,
                    top: mod.bloon.top,
                    bottom: mod.bloon.bottom
                }
                const bloon = fillBloon(basicBloon, data[mod.page])
                expect(bloon).toEqual(mod.bloon)
            }
        })
    }
})