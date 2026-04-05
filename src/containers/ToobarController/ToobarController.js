import { useContext } from 'react'
import { saveAs } from 'file-saver'
import { PDFDocument, rgb, degrees } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { xml2js, js2xml } from 'xml-js'
import JSZip from 'jszip'

import { FileContext } from '../../context/file-context'
import { ViewportContext } from '../../context/viewport-context'
import { CounterContext } from '../../context/counter-context'
import { ModificationContext } from '../../context/modification-context'
import { BloonsContext } from '../../context/bloons-context'

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

async function exportBloons(bloons) {
  for (const [id, bloon] of Object.entries(bloons).sort((a, b) => a[0].id - b[0].id)) {
    console.log(`${id}: bloon ${bloon.id} text elements: ${JSON.stringify(bloon.text.map(t => t.str))}`)
    const template = await fetch(process.env.PUBLIC_URL + '/template.xlsm')
    const zip = await JSZip.loadAsync(await template.blob())
    const readXml = async path => xml2js(await zip.file(path).async('string'), { trim: false, compact: false, captureSpacesBetweenElements: true })
    const writeXml = (path, data) => zip.file(path, js2xml(data))
    const first = e => e.elements.find(elem => elem.type === 'element')
    const only = (e, t) => { const f = e.elements.filter(elem => elem.type === 'element'); return f.length === 1 && f[0].name === t }

    const sharedStrings = await readXml('xl/sharedStrings.xml')
    const sharedStringsObj = Object.fromEntries(first(sharedStrings).elements.map((e, i) => [e, i]).filter(([e]) => e.name === 'si' && only(e, 't'))
      .map(([e, i]) => [first(e), i]).filter(([e]) => e.elements.length === 1 && e.elements[0].type === 'text').map(([e, i]) => [e.elements[0].text, i]))
    let sharedStringsIndex = first(sharedStrings).elements.filter(e => e.type === 'element').length

    const workbook = await readXml('xl/workbook.xml')
    const sheetId = first(workbook).elements.find(e => e.name === 'sheets').elements.find(e => e.name === 'sheet' && e.attributes.name === 'דוח ביקורת').attributes['r:id']

    const workbookRel = await readXml('xl/_rels/workbook.xml.rels')
    const sheetPath = first(workbookRel).elements.find(e => e.name === 'Relationship' && e.attributes.Id === sheetId).attributes.Target

    const sheet = await readXml(`xl/${sheetPath}`)

    const insert = (cell, data) => {
      const row = cell.slice(1)
      const rowObj = first(sheet).elements.find(e => e.name === 'sheetData').elements.find(e => e.name === 'row' && e.attributes.r === row)
      const colObj = rowObj.elements.find(e => e.name === 'c' && e.attributes.r === cell)
      let index = sharedStringsObj[data]
      const f = first(sharedStrings)
      f.attributes.count = `${parseInt(f.attributes.count) + 1}`
      if (index === undefined) {
        index = sharedStringsIndex++
        sharedStringsObj[data] = index
        f.attributes.uniqueCount = `${parseInt(f.attributes.uniqueCount) + 1}`
        f.elements.push(xml2js(`<si><t>${data}</t></si>`).elements[0])
      }
      colObj.attributes.t = 's'
      colObj.elements = xml2js(`<v>${index}</v>`).elements
    }

    insert('B23', 'VISUAL')
    for (const bloon of Object.values(bloons)) {
      insert(`B${bloon.id + 22}`, bloon.measurement)
      insert(`D${bloon.id + 22}`, bloon.content)
      if (bloon.tolerance) {
        insert(`E${bloon.id + 22}`, bloon.tolerance['+'])
        insert(`F${bloon.id + 22}`, bloon.tolerance['-'])
      }
    }

    writeXml('xl/sharedStrings.xml', sharedStrings)
    writeXml(`xl/${sheetPath}`, sheet)

    const blob = new Blob([await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })], { type: 'application/vnd.ms-excel.sheet.macroEnabled.12' })
    console.log('request to download file accepted', blob)
    saveAs(blob, 'דוח ביקורת.xlsm')
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
    onExport: () => exportBloons(bloons),
    fontSize,
    setFontSize
  })
}

export default ToolbarController
