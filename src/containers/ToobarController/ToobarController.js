import { useContext } from 'react'
import { saveAs } from 'file-saver'
import { PDFDocument, rgb, degrees } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf'

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


/**
 * Extracts text elements completely contained within a specified rectangle.
 * * @param {pdfjsLib.PDFPageProxy} page - The PDF page from the document, parsed.
 * @param {{ top: string, left: string, bottom: string, right: string }} targetRect - { top, left, bottom, right } with (0,0) at top-left.
 * @returns {Promise<{ text: string, position: { top: string, left: string, bottom: string, right: string }}[]>} Array of { text, position: { top, left, bottom, right } }.
 */
export async function extractTextFromBinaryPdf(page, targetRect) {
  // 2. Get the unscaled page height to perform the Y-axis inversion
  const viewport = page.getViewport({ scale: 1 })
  const pageHeight = viewport.height

  // 3. Fetch the raw text content
  const textContent = await page.getTextContent()
  const extractedElements = []

  // 4. Process and filter each text item
  for (const item of textContent.items) {
    // pdfjs-dist transform matrix: [scaleX, skewY, skewX, scaleY, translateX, translateY]
    const pdfX = item.transform[4]
    const pdfY = item.transform[5]
    const width = item.width
    const height = item.height

    // Convert native bottom-left coordinates to top-left (0,0) coordinates
    const itemLeft = pdfX
    const itemRight = pdfX + width

    // In a top-left system, the "top" of an element has a smaller Y value than its "bottom"
    const itemTop = pageHeight - (pdfY + height)
    const itemBottom = pageHeight - pdfY

    // Check if the item is completely inside the target rectangle
    const isInside = (
      itemLeft >= targetRect.left &&
      itemRight <= targetRect.right &&
      itemTop >= targetRect.top &&     // itemTop must be equal to or lower than rect.top
      itemBottom <= targetRect.bottom  // itemBottom must be equal to or higher than rect.bottom
    )

    if (isInside) {
      extractedElements.push({
        text: item.str,
        position: {
          top: itemTop,
          left: itemLeft,
          bottom: itemBottom,
          right: itemRight
        }
      })
    }
  }

  return extractedElements
}

async function exportBloons(bloons, fileData, pageNumber = 1) {
  const loadingTask = pdfjsLib.getDocument({ data: fileData })
  const pdfDocument = await loadingTask.promise
  const page = await pdfDocument.getPage(pageNumber)
  for (const [id, bloon] of Object.entries(bloons).sort((a, b) => a[0].id - b[0].id)) {
    // console.log(`bloon ${bloon.id}: ${JSON.stringify(bloon)}`)
    const textElements = await extractTextFromBinaryPdf(page, bloon)
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
    onExport: () => exportBloons(bloons, fileData),
    fontSize,
    setFontSize
  })
}

export default ToolbarController
