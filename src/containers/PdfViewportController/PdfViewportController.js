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
  const { addBloon, removeBloon, fillBloon, modifyBloon } = useContext(BloonsContext)
  const [markedPosition, setMarkedPosition] = useState(null)

  const isMain = event => event.button === 0
  const onMouseDown = (event, position) => isMain(event) && setMarkedPosition(position)
  const onMouseUp = (event, position) => {
    if (!isMain(event) || !markedPosition) return
    const id = nextId
    const template = value => `(${value})`
    const bloon = { id: counter, top: markedPosition.y / scale, left: markedPosition.x / scale, bottom: position.y / scale, right: position.x / scale }
    const isInside = (border) => border.left >= bloon.left && border.right <= bloon.right && border.top >= bloon.top && border.bottom <= bloon.bottom
    bloon.text = text.filter(t => isInside(t.border))
    bloon.symbols = Object.fromEntries(Object.entries(symbols).map(e => [e[0], e[1].find(isInside)]).filter(e => e[1]))

    fillBloon(bloon)
    addBloon(id, bloon)
    addModification({
      position: {
        x: (position.x + scale) / scale,
        y: position.y / scale
      },
      value: counter,
      title: `${bloon.measurement}: ${bloon.content}${bloon.tolerance ? ` (${bloon.tolerance['+']}/${bloon.tolerance['-']})` : ''}`,
      template
    })
    incrementCounter()
    setMarkedPosition(null)
    if (bloon.measurement === 'TAP') {
      const newBloon = { ...bloon, id: bloon.id + 1, measurement: 'DIA' }
      addBloon(id + 1, newBloon)
      addModification({
        position: {
          x: (position.x + scale) / scale + 25,
          y: position.y / scale
        },
        value: counter,
        title: `${newBloon.measurement}: ${newBloon.content}${newBloon.tolerance ? ` (${newBloon.tolerance['+']}/${newBloon.tolerance['-']})` : ''}`,
        template
      })
      incrementCounter()
    }
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
    markedPosition,
    onChangeMeasurement: (id, measurement) => {
      modifyBloon(id, { measurement })
      changeMod(id, mod => {
        mod.title = measurement + mod.title.slice(mod.title.indexOf(':'))
        return mod
      })
    }
  })
}

export default PdfViewportController
