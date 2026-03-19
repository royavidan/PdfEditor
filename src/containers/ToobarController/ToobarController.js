import { useContext } from 'react'
import { saveAs } from 'file-saver'
import { PDFDocument, rgb, degrees } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'

import { FileContext } from '../../context/file-context'
import { ViewportContext } from '../../context/viewport-context'
import { CounterContext } from '../../context/counter-context'
import { ModificationContext } from '../../context/modification-context'
import { BloonsContext } from '../../context/bloons-context'
import { PDFContext } from '../../context/pdf-context'

const getPositiveAngle = angle => ((angle % 360) + 360) % 360

function translatePos(angle, x, y, width, height) {
  switch (angle) {
    case 0:
      return { x, y }
    case 90:
      return { x: y, y: height - x }
    case 180:
      return { x: width - x, y: height - y }
    case 270:
      return { x: width - y, y: x }
  }
}

function exportBloons(bloons, { text, symbols }) {
  for (const [id, bloon] of Object.entries(bloons).sort((a, b) => a[0].id - b[0].id)) {
    const isInside = elem => elem.left >= bloon.left && elem.right <= bloon.right && elem.top >= bloon.top && elem.bottom <= bloon.bottom
    const textElements = text.filter(isInside)
    console.log(`${id}: bloon ${bloon.id} text elements: ${JSON.stringify(textElements.map(t => t.text))}`)
  }
}

async function download(fileData, modificationList, fontSize) {
  const pdfDoc = await PDFDocument.load(fileData)
  const fontUrl = `${process.env.PUBLIC_URL}/fonts/Roboto/Roboto-Regular.ttf`
  pdfDoc.registerFontkit(fontkit)
  const fontBytes = await fetch(fontUrl).then(res => res.arrayBuffer())
  console.log('font loaded: ', fontBytes)
  const font = await pdfDoc.embedFont(fontBytes)
  const [firstPage] = pdfDoc.getPages()
  const { width, height } = firstPage.getSize()
  const originalAngle = firstPage.getRotation().angle
  const angle = getPositiveAngle(originalAngle)
  console.log(`original: ${originalAngle} angle: ${angle}`)

  modificationList.forEach(item => {
    const position = translatePos(
      angle,
      item.position.x - fontSize / 2,
      item.position.y + fontSize / 2,
      width,
      height
    )
    firstPage.drawText(item.template(item.value), {
      x: position.x,
      y: height - position.y,
      rotate: degrees(angle),
      size: fontSize,
      font,
      color: rgb(0, 0, 1)
    })
  })
  const modifiedData = await pdfDoc.save()

  const blob = new Blob([modifiedData], { type: 'application/pdf' })
  console.log('request to download file accepted', blob)
  saveAs(blob, 'output.pdf')
}

async function rotate(fileData, setFileData, angle) {
  const pdfDoc = await PDFDocument.load(fileData)
  const [firstPage] = pdfDoc.getPages()
  const currAngle = firstPage.getRotation().angle
  firstPage.setRotation(degrees(currAngle + angle))
  const modifiedData = await pdfDoc.save()
  setFileData(modifiedData)
}

function ToolbarController({ children }) {
  const { data: fileData, isFileLoaded, setData: setFileData } = useContext(
    FileContext
  )
  const { scale, setScale, fontSize, setFontSize } = useContext(ViewportContext)
  const { initialCounter, setInitialCounter, counter, resetCounter } = useContext(CounterContext)
  const { modList, resetModList } = useContext(ModificationContext)
  const { bloons, resetBloons } = useContext(BloonsContext)
  const pdfContent = useContext(PDFContext)
  const onZoomChange = amount => setScale(scale => scale + amount)

  return children({
    disabled: isFileLoaded() === false,
    scale,
    onZoomChange,
    onRotate: angle => {
      if (modList.length !== 0) {
        const result = window.confirm('Warning: all changes will be lost') // TODO: replace this with a proper modal
        if (result === false) {
          return // cancel rotation
        }
      }
      rotate(fileData, setFileData, angle)
      resetModList()
      resetBloons()
      resetCounter()
    },
    initialCounter,
    setInitialCounter,
    counter,
    onDownload: () => download(fileData, modList, fontSize),
    onExport: () => exportBloons(bloons, pdfContent),
    fontSize,
    setFontSize
  })
}

export default ToolbarController
