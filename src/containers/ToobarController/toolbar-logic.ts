import { saveAs } from 'file-saver'
import { PDFDocument, rgb, degrees } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { xml2js, js2xml, type Element } from 'xml-js'
import JSZip from 'jszip'

import { translatePos, getPositiveAngle } from '../../utils'
import type { FileData } from '../../context/file-context'
import type { Modification } from '../../context/modification-context'

export async function exportBloons(modList: Modification[], name: string) {
  const template = await fetch('https://raw.githubusercontent.com/royavidan/PdfEditor/refs/heads/resources/template.xlsm')
  const zip = await JSZip.loadAsync(await template.blob())
  const readXml = async (path: string) => xml2js(await zip.file(path)!.async('string'), { trim: false, compact: false, captureSpacesBetweenElements: true })
  const writeXml = (path: string, data: Element) => zip.file(path, js2xml(data))
  const first = (e: Element) => e.elements?.find(elem => elem.type === 'element')
  const only = (e: Element, t: string) => { const f = e.elements?.filter(elem => elem.type === 'element'); return Boolean(f && f.length === 1 && f[0].name === t) }

  const sharedStrings = await readXml('xl/sharedStrings.xml') as Element
  const sharedStringsObj = Object.fromEntries(first(sharedStrings)!.elements!.map((e, i) => [e, i] as const).filter(([e]) => e.name === 'si' && only(e, 't'))
    .map(([e, i]) => [first(e)!, i] as const).filter(([e]) => e.elements!.length === 1 && e.elements![0].type === 'text').map(([e, i]) => [e.elements![0].text, i]))
  let sharedStringsIndex = first(sharedStrings)!.elements!.filter(e => e.type === 'element').length

  const workbook = await readXml('xl/workbook.xml') as Element
  const sheetId = first(workbook)!.elements!.find(e => e.name === 'sheets')!.elements!.find(e => e.name === 'sheet' && e.attributes!.name === 'דוח ביקורת')!.attributes!['r:id']

  const workbookRel = await readXml('xl/_rels/workbook.xml.rels') as Element
  const sheetPath = first(workbookRel)!.elements!.find(e => e.name === 'Relationship' && e.attributes!.Id === sheetId)!.attributes!.Target

  const sheet = await readXml(`xl/${sheetPath}`) as Element

  const insert = (cell: string, data: string | number) => {
    const row = cell.slice(1)
    const rowObj = first(sheet)!.elements!.find(e => e.name === 'sheetData')!.elements!.find(e => e.name === 'row' && e.attributes!.r === row)!
    const colObj = rowObj.elements!.find(e => e.name === 'c' && e.attributes!.r === cell)!
    let index = sharedStringsObj[data]
    const f = first(sharedStrings)!
    f.attributes!.count = `${parseInt(f.attributes!.count as string) + 1}`
    if (index === undefined) {
      index = sharedStringsIndex++
      sharedStringsObj[data] = index
      f.attributes!.uniqueCount = `${parseInt(f.attributes!.uniqueCount as string) + 1}`
      f.elements!.push(xml2js(`<si><t>${data}</t></si>`).elements[0])
    }
    colObj.attributes!.t = 's'
    colObj.elements = xml2js(`<v>${index}</v>`).elements
  }

  const firstRowNum = 22
  insert(`B${firstRowNum + 1}`, 'VISUAL')
  for (const mod of modList) {
    const bloon = mod.bloon!, row = mod.value + firstRowNum
    insert(`B${row}`, bloon.measurement)
    insert(`D${row}`, bloon.content)
    if (bloon.tolerance) {
      insert(`E${row}`, bloon.tolerance['+'])
      insert(`F${row}`, bloon.tolerance['-'])
    }
  }

  writeXml('xl/sharedStrings.xml', sharedStrings)
  writeXml(`xl/${sheetPath}`, sheet)
  const blob = new Blob([await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })], { type: 'application/vnd.ms-excel.sheet.macroEnabled.12' })
  console.log('request to download file accepted', blob)
  saveAs(blob, `${name}.xlsm`)
}

export async function download(fileData: FileData, modificationList: Modification[], fontSize: number, name: string) {
  const pdfDoc = await PDFDocument.load(fileData)
  pdfDoc.registerFontkit(fontkit)
  const fontBytes = await fetch('/fonts/Roboto/Roboto-Regular.ttf').then(res => res.arrayBuffer())
  const font = await pdfDoc.embedFont(fontBytes)
  await Promise.all(pdfDoc.getPages().map(async (page, index) => {
    const { width, height } = page.getSize()
    const originalAngle = page.getRotation().angle
    const angle = getPositiveAngle(originalAngle)

    modificationList.forEach(item => {
      if (item.page !== index) return
      const position = translatePos(
        angle,
        item.position.x - fontSize / 2,
        item.position.y + fontSize / 2,
        width,
        height
      )
      page.drawText(`(${item.value})`, {
        x: position.x,
        y: height - position.y,
        rotate: degrees(angle),
        size: fontSize,
        font,
        color: rgb(0, 0, 1)
      })
    })
  }))
  
  const modifiedData = await pdfDoc.save()

  const blob = new Blob([modifiedData.buffer as FileData], { type: 'application/pdf' })
  console.log('request to download file accepted', blob)
  saveAs(blob, name)
}

export async function rotate(fileData: FileData, setFileData: (data: FileData) => void, angle: number, currentPage: number) {
  const pdfDoc = await PDFDocument.load(fileData)
  const page = pdfDoc.getPages()[currentPage]
  const currAngle = page.getRotation().angle
  page.setRotation(degrees(currAngle + angle))
  const modifiedData = await pdfDoc.save()
  setFileData(modifiedData.buffer as FileData)
}