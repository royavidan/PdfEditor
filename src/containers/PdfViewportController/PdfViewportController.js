import { useContext, useState } from 'react'

import { FileContext } from '../../context/file-context'
import { ViewportContext } from '../../context/viewport-context'
import { CounterContext } from '../../context/counter-context'
import { ModificationContext } from '../../context/modification-context'
import { BloonsContext } from '../../context/bloons-context'

function PdfViewportController({ children }) {
  const { data } = useContext(FileContext)
  const { scale, fontSize } = useContext(ViewportContext)
  const { counter, incrementCounter, decrementCounter } = useContext(
    CounterContext
  )
  const { modList, nextId, addMod: addModification, changeMod, removeMod } = useContext(
    ModificationContext
  )
  const { addBloon, removeBloon } = useContext(BloonsContext)
  const [markedPosition, setMarkedPosition] = useState(null)

  const onClick = (event, position) => {
    if (markedPosition === null) {
      setMarkedPosition(position)
    } else {
      const template = value => `(${value})`
      addBloon(nextId, { id: counter, top: markedPosition.y / scale, left: markedPosition.x / scale, bottom: position.y / scale, right: position.x / scale })
      addModification({
        position: {
          x: (position.x + scale) / scale,
          y: position.y / scale
        },
        value: counter,
        template
      })
      incrementCounter()
      setMarkedPosition(null)
    }
  }

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
      console.log(`OnItemDelete(${id})`)
      removeMod(id)
      removeBloon(id)
      decrementCounter()
    },
    fontSize,
    markedPosition
  })
}

export default PdfViewportController
