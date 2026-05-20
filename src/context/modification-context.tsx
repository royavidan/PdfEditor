import React, { useState, createContext } from 'react'
import type { ContextProvider, Permutation, Position, Border } from '../types'

export interface Bloon extends Border {
    content: string
    measurement: string
    tolerance?: {
        '+': number | string
        '-': number | string
    }
}

export interface Modification {
  readonly id: number
  value: number
  position: Position
  page: number
  bloon: Bloon
  disabled?: boolean
}

export const isModification = (mod: any): mod is Modification => 
  typeof mod === 'object'
  && typeof mod.id === 'number'
  && typeof mod.value === 'number'
  && typeof mod.position === 'object' && typeof mod.position.x === 'number' && typeof mod.position.y === 'number'
  && typeof mod.page === 'number'
  && typeof mod.bloon === 'object'
    && typeof mod.bloon.left === 'number'
    && typeof mod.bloon.right === 'number'
    && typeof mod.bloon.top === 'number'
    && typeof mod.bloon.bottom === 'number'
    && typeof mod.bloon.content === 'string'
    && typeof mod.bloon.measurement === 'string'
    && ((typeof mod.bloon.tolerance === 'object' && typeof mod.bloon.tolerance['+'] === 'number' && typeof mod.bloon.tolerance['-'] === 'number') || !('tolerance' in mod.bloon))
  && (typeof mod.disabled === 'boolean' || !('disabled' in mod))

type ModificationInput = Omit<Modification, 'id'>

export interface ModificationContext {
  modList: Modification[]
  nextId: number
  resetModList(): void
  addMod(mod: ModificationInput, imm?: number): void
  changeMod(id: number, mod: Permutation<Modification>): void
  removeMod(id: number): void
}

const initialModList: Modification[] = []
const initialId = 0

export const ModificationContext = createContext({
  modList: initialModList,
  nextId: initialId,
  resetModList: () => { },
  addMod: () => { },
  changeMod: () => { },
  removeMod: () => { }
} as ModificationContext)

export default (({ children }) => {
  const [modList, setModList] = useState(initialModList)
  const [nextId, setNextId] = useState(initialId)
  
  const resetModList = () => {
    setModList(initialModList)
    setNextId(initialId)
  }

  const addMod: ModificationContext['addMod'] = (mod, imm = 0) => {
    setNextId(id => id + 1)
    setModList(modList => [
      ...modList.map(m => m.value < mod.value ? m : { ...m, value: m.value + 1 }),
      { ...mod, id: nextId + imm }
    ])
  }

  const changeMod: ModificationContext['changeMod'] = (id, changeFunc) => {
    const changedModList = modList.map(mod =>
      mod.id !== id ? mod : changeFunc(mod)
    )

    setModList(changedModList)
  }

  const removeMod: ModificationContext['removeMod'] = id => {
    const originalMod = modList.find(mod => mod.id === id)!
    setModList(modList => modList
      .filter(mod => mod.id !== id)
      .map(mod => (mod.value < originalMod.value ? mod : { ...mod, value: mod.value - 1 })))
  }

  return (
    <ModificationContext.Provider
      value={{
        modList,
        nextId,
        resetModList,
        addMod,
        changeMod,
        removeMod
      }}
    >
      {children}
    </ModificationContext.Provider>
  )
}) as ContextProvider
