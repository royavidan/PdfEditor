import React, { useState, createContext } from 'react'

const initialModList = []
const initialId = 0

export const ModificationContext = createContext({
  modList: initialModList,
  nextId: initialId,
  resetModList: () => {},
  addMod: () => {},
  changeMod: (id, changeFunc) => {},
  insertMod: (mod) => {},
  removeMod: id => {}
})

export default ({ children }) => {
  const [modList, setModList] = useState(initialModList)
  const [nextId, setNextId] = useState(initialId)
  const resetModList = () => {
    setModList(initialModList)
    setNextId(initialId)
  }

  const addMod = (mod, imm = 0) => {
    setNextId(id => id + 1)
    return setModList(modList => [
      ...modList.map(m => m.value < mod.value ? m : { ...m, value: m.value + 1 }),
      {
        ...mod,
        id: nextId + imm
      }
    ])
  }

  const changeMod = (id, changeFunc) => {
    const changedModList = modList.map(mod =>
      mod.id !== id ? mod : changeFunc(mod)
    )

    setModList(changedModList)
  }

  const insertMod = (mod) => {
    setNextId(id => id + 1)
    return setModList(modList => [
      ...modList.map(m => m.value < mod.value ? m : { ...m, value: m.value + 1 }),
      {
        ...mod,
        id: nextId
      }
    ])
  }

  const removeMod = id => {
    setModList(modList => modList
      .filter(mod => mod.id !== id)
      .map(mod => (mod.value < modList[id].value ? mod : { ...mod, value: mod.value - 1 })))
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
}
