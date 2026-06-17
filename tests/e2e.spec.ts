import { test, expect } from '@playwright/test'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { tryLoadMods } from '../src/containers/LoadDialogController/file-logic'
import * as pdfjs from '../node_modules/pdfjs-dist/legacy/build/pdf.mjs'
import JSZip from 'jszip'
import { Element, xml2js } from 'xml-js'
import type { TextItem } from 'pdfjs-dist/types/src/display/api'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

test.describe('PDF Editor E2E Integration Test', () => {
  test('should load PDF, allow drawing rectangles, and test Save/Export/Download', async ({ page }) => {
    // 1. Navigate to the app (Playwright will start the Vite dev server)
    page.on('console', msg => console.log('BROWSER:', msg.text()))
    page.on('pageerror', err => console.error('BROWSER ERROR:', err.message))
    await page.goto('/PdfEditor')

    // 2. Locate the file input and upload the generated test PDF
    const testPdfPath = path.resolve(__dirname, 'test-input.pdf')
    expect(fs.existsSync(testPdfPath)).toBe(true)

    const fileChooserPromise = page.waitForEvent('filechooser')
    await page.click('text=Drop a file here or click to upload')
    const fileChooser = await fileChooserPromise
    await fileChooser.setFiles(testPdfPath)

    // Wait for the upload dropzone to disappear and canvas to be visible
    await expect(page.locator('text=Drop a file here')).not.toBeVisible()
    const canvas = page.locator('canvas')
    await expect(canvas).toBeVisible()

    // Wait for the PDF loading worker to finish processing so the viewport becomes enabled
    console.log('Waiting for PDF worker to extract page data...')
    await expect(page.locator('button:has-text("Download")')).toBeEnabled()

    // Helper function to drag-select on canvas using dynamic bounding box calculations to handle any scrolling robustly
    const drawSelection = async (name: string, x1: number, y1: number, x2: number, y2: number) => {
      const box = (await canvas.boundingBox())!
      console.log(`[${name}] Canvas at: ${box.x}, ${box.y}, dragging relative: (${x1}, ${y1}) -> (${x2}, ${y2})`)
      await page.mouse.move(box.x + x1, box.y + y1)
      await page.mouse.down()
      await page.mouse.move(box.x + x2, box.y + y2, { steps: 5 })
      await page.mouse.up()
      await page.waitForTimeout(2000) // Wait for state updates/render cycle to complete
      const count = await page.locator('[class*="item"]').count()
      console.log(`[${name}] Current overlays count: ${count}`)
    }

    // Draw selection boxes around our 4 text blocks
    // Block 1: "12.5" at y_pdf=600 -> y_canvas=241.92. Drag from (80, 210) to (180, 260)
    console.log('Selecting Block 1 ("12.5")...')
    await drawSelection('Block 1', 80, 210, 180, 260)

    // Block 2: "⌀ 15.0" at y_pdf=500 -> y_canvas=341.92. Drag from (80, 310) to (190, 360)
    console.log('Selecting Block 2 ("⌀ 15.0")...')
    await drawSelection('Block 2', 80, 310, 190, 360)

    // Block 3: "20.0 ± 0.2" at y_pdf=400 -> y_canvas=441.92. Drag from (80, 410) to (250, 460)
    console.log('Selecting Block 3 ("20.0 ± 0.2")...')
    await drawSelection('Block 3', 80, 410, 250, 460)

    // Block 4: "10.0 ↧ 5.0" at y_pdf=300 -> y_canvas=541.92. Drag from (80, 510) to (250, 560)
    console.log('Selecting Block 4 ("10.0 ↧ 5.0")...')
    await drawSelection('Block 4', 80, 510, 250, 560)

    // Verify 4 overlays are created displaying labeled indices (initialCounter starts at 2)
    const overlayItems = page.locator('[class*="item"]')
    await expect(overlayItems).toHaveCount(4)
    await expect(overlayItems.nth(0)).toHaveText('(2)')
    await expect(overlayItems.nth(1)).toHaveText('(3)')
    await expect(overlayItems.nth(2)).toHaveText('(4)')
    await expect(overlayItems.nth(3)).toHaveText('(5)')

    // ----------------------------------------------------
    // TEST 1: SAVE COMMAND
    // ----------------------------------------------------
    console.log('Testing "Save" command...')
    const saveDownloadPromise = page.waitForEvent('download')
    await page.click('button[title*="Save"]')
    const saveDownload = await saveDownloadPromise
    expect(saveDownload.suggestedFilename()).toContain('test-input - in progress.pdf')
    const savePath = path.resolve(__dirname, 'downloaded-saved.pdf')
    await saveDownload.saveAs(savePath)

    // Validate the saved file contains the encoded modifications
    const savedBytes = fs.readFileSync(savePath)
    const loadedMods = tryLoadMods(savedBytes.buffer)
    expect(loadedMods.modList).not.toBeNull()
    expect(loadedMods.modList!.length).toBe(4)

    expect(loadedMods.modList![0].value).toBe(2)
    expect(loadedMods.modList![0].bloon.measurement).toBe('LINEAR')
    expect(loadedMods.modList![0].bloon.content).toBe('12.5')

    expect(loadedMods.modList![1].value).toBe(3)
    expect(loadedMods.modList![1].bloon.measurement).toBe('DIA')
    expect(loadedMods.modList![1].bloon.content).toBe('15.0')

    expect(loadedMods.modList![2].value).toBe(4)
    expect(loadedMods.modList![2].bloon.measurement).toBe('LINEAR')
    expect(loadedMods.modList![2].bloon.content).toBe('20.0')
    expect(loadedMods.modList![2].bloon.tolerance).toEqual({ '+': 0.2, '-': 0.2 })

    expect(loadedMods.modList![3].value).toBe(5)
    expect(loadedMods.modList![3].bloon.measurement).toBe('DEPTH')
    expect(loadedMods.modList![3].bloon.content).toBe('10.05.0mm')

    // ----------------------------------------------------
    // TEST 2: DOWNLOAD COMMAND
    // ----------------------------------------------------
    console.log('Testing "Download" command...')
    const finalDownloadPromise = page.waitForEvent('download')
    await page.click('button[title*="Download"]')
    const finalDownload = await finalDownloadPromise
    expect(finalDownload.suggestedFilename()).toBe('test-input.pdf')
    const downloadPath = path.resolve(__dirname, 'downloaded-final.pdf')
    await finalDownload.saveAs(downloadPath)

    // Validate the final PDF contains the label text items "(2)", "(3)", "(4)", "(5)"
    const finalBytes = fs.readFileSync(downloadPath)
    const loadingTask = pdfjs.getDocument({ data: new Uint8Array(finalBytes.buffer) })
    const pdfDocument = await loadingTask.promise
    const firstPage = await pdfDocument.getPage(1)
    const textContent = await firstPage.getTextContent()
    const strings = (textContent.items as TextItem[]).map(item => item.str)
    console.log('Text strings in downloaded PDF:', strings)
    expect(strings).toContain('(2)')
    expect(strings).toContain('(3)')
    expect(strings).toContain('(4)')
    expect(strings).toContain('(5)')

    // ----------------------------------------------------
    // TEST 3: EXPORT COMMAND
    // ----------------------------------------------------
    console.log('Testing "Export" command...')
    const exportDownloadPromise = page.waitForEvent('download')
    await page.click('button[title*="Export"]')
    const exportDownload = await exportDownloadPromise
    expect(exportDownload.suggestedFilename()).toContain('.xlsm')
    const exportPath = path.resolve(__dirname, 'exported.xlsm')
    await exportDownload.saveAs(exportPath)

    // Validate the exported Excel sheet content
    const exportBytes = fs.readFileSync(exportPath)
    const zip = await JSZip.loadAsync(exportBytes)
    expect(zip.file('xl/sharedStrings.xml')).not.toBeNull()

    // Read shared strings to verify the data values were written
    const sharedStringsXml = await zip.file('xl/sharedStrings.xml')!.async('string')
    const sharedStrings = xml2js(sharedStringsXml, { compact: false })
    const texts = sharedStrings.elements[0].elements
      .filter((el: Element) => el.name === 'si')
      .map((el: Element) => {
        // Handle various styles of <si><t>...</t></si> structure
        const tEl = el.elements!.find((item: Element) => item.name === 't')
        return tEl && tEl.elements ? tEl.elements[0].text : ''
      })
    console.log('Shared strings in exported Excel:', texts)

    // Verify that the measurements and contents are written to Excel
    expect(texts).toContain('LINEAR')
    expect(texts).toContain('12.5')
    expect(texts).toContain('DIA')
    expect(texts).toContain('15.0')
    expect(texts).toContain('20.0')
    expect(texts).toContain('0.2')
    expect(texts).toContain('DEPTH')
    expect(texts).toContain('10.05.0mm')

    console.log('All toolbar command tests completed successfully!')
  })
})
