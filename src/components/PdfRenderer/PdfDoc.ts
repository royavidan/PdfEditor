import { type ReactNode, useEffect, useState } from 'react'
import * as pdfjs from 'pdfjs-dist'

import type { PDFDocumentProxy } from 'pdfjs-dist'
import type { FileData } from '../../context/file-context'

function loadDocument(data: FileData) {
  return pdfjs.getDocument(data.slice(0)).promise
}

interface PdfDocProps {
  data: FileData
  children(docObj: PDFDocumentProxy): ReactNode
}

function PdfDoc({ data, children }: PdfDocProps) {
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null)

  useEffect(() => {
    loadDocument(data).then(setDoc)
  }, [data])

  return doc && children(doc)
}

export default PdfDoc
