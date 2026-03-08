import { useContext, useState } from 'react'

import { FileContext } from '../../context/file-context'
import { ViewportContext } from '../../context/viewport-context'
import { CounterContext } from '../../context/counter-context'
import { ModificationContext } from '../../context/modification-context'
import { BloonsContext } from '../../context/bloons-context'

function startRunningCounter(scale,
  counter,
  position,
  addModification,
  incrementCounter,
  setOnClick,
  addBloon) {
  setOnClick(() => (event, newPosition) => stopRunningCounter(
    scale,
    counter,
    newPosition,
    addModification,
    incrementCounter,
    setOnClick,
    position,
    addBloon
  ))
}

function stopRunningCounter(scale,
  counter,
  position,
  addModification,
  incrementCounter,
  setOnClick,
  formerPosition,
  addBloon) {
  const template = value => `(${value})`
  addModification({
    position: {
      x: (position.x + scale) / scale,
      y: position.y / scale
    },
    value: counter,
    template
  })
  addBloon(counter, { top: formerPosition.y / scale, left: formerPosition.x / scale, bottom: position.y / scale, right: position.x / scale })
  incrementCounter()
  setOnClick(() => (event, position) => startRunningCounter(
    scale,
    counter,
    position,
    addModification,
    incrementCounter,
    setOnClick,
    addBloon
  ))
}

function PdfViewportController({ children }) {
  const { data } = useContext(FileContext)
  const { scale, fontSize } = useContext(ViewportContext)
  const { counter, incrementCounter, decrementCounter } = useContext(
    CounterContext
  )
  const { modList, addMod: addModification, changeMod, removeMod } = useContext(
    ModificationContext
  )
  const { addBloon } = useContext(BloonsContext)
  const [onClick, setOnClick] = useState(() => (event, pos) =>
      startRunningCounter(
        scale,
        counter,
        pos,
        addModification,
        incrementCounter,
        setOnClick,
        addBloon
      ))

  return children({
    data,
    pageNum: 1,
    scale,
    overlayItems: modList,
    onClick,
    onItemMove: (event, position, id) => {
      changeMod(id, mod => ({
        ...mod,
        position: {
          x: position.x / scale,
          y: position.y / scale
        }
      }))
    },
    onItemDelete: id => {
      removeMod(id)
      decrementCounter()
    },
    fontSize
  })
}

export default PdfViewportController
