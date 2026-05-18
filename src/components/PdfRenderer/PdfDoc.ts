import { useEffect, useState } from 'react'
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.js'

import type { PDFDocumentProxy } from 'pdfjs-dist'
import { FileData } from '../../context/file-context'

function loadDocument(data: FileData) {
  return pdfjs.getDocument(data).promise
}

interface PdfDocProps {
  data: FileData
  children(docObj: PDFDocumentProxy): JSX.Element
}

function PdfDoc({ data, children }: PdfDocProps) {
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null)

  useEffect(() => {
    loadDocument(data).then(setDoc)
  }, [data])

  return doc && children(doc)
}

export default PdfDoc
