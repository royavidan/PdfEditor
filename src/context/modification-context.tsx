import React, { useState, createContext } from 'react'
import type { ContextProvider, Permutation } from '../types'

declare global {
  export interface Modification {
    readonly id: number
    value: number
  }
}

type ModificationInput = Omit<Modification, 'id'>

export interface ModificationContext {
  modList: Modification[]
  nextId: number
  resetModList(): void
  addMod(mod: ModificationInput, imm?: number): void
  changeMod(id: number, mod: Permutation<Modification>): void
  insertMod(mod: ModificationInput): void
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
  insertMod: () => { },
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
    return setModList(modList => [
      ...modList.map(m => m.value < mod.value ? m : { ...m, value: m.value + 1 }),
      {
        ...mod,
        id: nextId + imm
      }
    ])
  }

  const changeMod: ModificationContext['changeMod'] = (id, changeFunc) => {
    const changedModList = modList.map(mod =>
      mod.id !== id ? mod : changeFunc(mod)
    )

    setModList(changedModList)
  }

  const insertMod: ModificationContext['insertMod'] = (mod) => {
    setNextId(id => id + 1)
    return setModList(modList => [
      ...modList.map(m => m.value < mod.value ? m : { ...m, value: m.value + 1 }),
      {
        ...mod,
        id: nextId
      }
    ])
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
        insertMod,
        removeMod
      }}
    >
      {children}
    </ModificationContext.Provider>
  )
}) as ContextProvider
