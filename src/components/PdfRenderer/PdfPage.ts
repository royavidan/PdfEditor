import { useEffect, useState } from 'react'

import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist'

function loadPage(doc: PDFDocumentProxy, pageNum: number) {
  return doc.getPage(pageNum)
}

interface PdfPageProps {
  document: PDFDocumentProxy
  pageNum: number
  children(pageObj: PDFPageProxy): JSX.Element
}

function PdfPage({ document, pageNum, children }: PdfPageProps) {
  const [page, setPage] = useState<PDFPageProxy | null>(null)

  useEffect(() => {
    loadPage(document, pageNum).then(setPage)
  }, [document, pageNum])

  return page && children(page)
}

export default PdfPage
