import { useContext, useState } from 'react'

import { FileContext } from '../../context/file-context'
import { ViewportContext } from '../../context/viewport-context'
import { CounterContext } from '../../context/counter-context'
import { ModificationContext } from '../../context/modification-context'
import { BloonsContext } from '../../context/bloons-context'
import { PDFContext } from '../../context/pdf-context'

function PdfViewportController({ children }) {
  const { data } = useContext(FileContext)
  const { scale, fontSize } = useContext(ViewportContext)
  const { text, symbols } = useContext(PDFContext)
  const { counter, incrementCounter, decrementCounter } = useContext(
    CounterContext
  )
  const { modList, nextId, addMod: addModification, changeMod, removeMod } = useContext(
    ModificationContext
  )
  const { addBloon, removeBloon } = useContext(BloonsContext)
  const [markedPosition, setMarkedPosition] = useState(null)

  const isMain = event => event.button === 0
  const onMouseDown = (event, position) => isMain(event) && setMarkedPosition(position)
  const onMouseUp = (event, position) => {
    if (!isMain(event) || !markedPosition) return
    const template = value => `(${value})`
    const bloon = { id: counter, top: markedPosition.y / scale, left: markedPosition.x / scale, bottom: position.y / scale, right: position.x / scale }
    const isInside = elem => elem.left >= bloon.left && elem.right <= bloon.right && elem.top >= bloon.top && elem.bottom <= bloon.bottom
    bloon.text = text.filter(isInside)
    bloon.symbols = Object.fromEntries(Object.entries(symbols).map(e => [e[0], e[1].find(isInside)]).filter(e => e[1]))

    addBloon(nextId, bloon)
    addModification({
      position: {
        x: (position.x + scale) / scale,
        y: position.y / scale
      },
      value: counter,
      title: bloon.text.map(t => t.str).join(''),
      template
    })
    incrementCounter()
    setMarkedPosition(null)
  }
  const onMouseLeave = event => isMain(event) && setMarkedPosition(null)

  return children({
    data,
    pageNum: 1,
    scale,
    overlayItems: modList,
    onMouseDown,
    onMouseUp,
    onMouseLeave,
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
      removeBloon(id)
      decrementCounter()
    },
    fontSize,
    markedPosition
  })
}

export default PdfViewportController
