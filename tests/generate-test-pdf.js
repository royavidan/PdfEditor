import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { PDFDocument, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function generate() {
    const emptyPath = path.resolve(__dirname, '../src/test-utils/data/empty.pdf')
    const fontPath = path.resolve(__dirname, '../public/fonts/Roboto/Roboto-Regular.ttf')
    const outputPath = path.resolve(__dirname, 'test-input.pdf')

    console.log('Loading base empty PDF...')
    const emptyPdfBytes = fs.readFileSync(emptyPath)
    const fontBytes = fs.readFileSync(fontPath)

    const pdfDoc = await PDFDocument.load(emptyPdfBytes)
    pdfDoc.registerFontkit(fontkit)
    const font = await pdfDoc.embedFont(fontBytes)

    const pages = pdfDoc.getPages()
    const page = pages[0]
    const { width, height } = page.getSize()
    console.log(`PDF Page size: ${width}x${height}`)

    // Draw text blocks at specific coordinates (x, y) where (0,0) is bottom-left
    // Let's use a clear font size of 20
    const fontSize = 20

    // Block 1: "12.5" at (100, 600)
    page.drawText("12.5", {
        x: 100,
        y: 600,
        size: fontSize,
        font,
        color: rgb(0, 0, 0)
    })

    // Block 2: "\x01n\x02 15.0" at (100, 500)
    page.drawText("\x01n\x02 15.0", {
        x: 100,
        y: 500,
        size: fontSize,
        font,
        color: rgb(0, 0, 0)
    })

    // Block 3: "20.0 ±0.2" at (100, 400)
    page.drawText("20.0 ±0.2", {
        x: 100,
        y: 400,
        size: fontSize,
        font,
        color: rgb(0, 0, 0)
    })

    // Block 4: "10.0 \x01x\x02 5.0mm" at (100, 300) - mm suffix avoids tolerance heuristic clash
    page.drawText("10.0 \x01x\x02 5.0mm", {
        x: 100,
        y: 300,
        size: fontSize,
        font,
        color: rgb(0, 0, 0)
    })

    console.log('Saving generated PDF...')
    const pdfBytes = await pdfDoc.save()
    fs.writeFileSync(outputPath, pdfBytes)
    console.log(`Test PDF generated successfully at ${outputPath}`)
}

generate().catch(err => {
    console.error('Error generating test PDF:', err)
    process.exit(1)
})
