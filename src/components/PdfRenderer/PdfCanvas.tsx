import React, { useRef, useEffect } from 'react'
import type { PDFPageProxy } from 'pdfjs-dist'

import type { Position } from '../../types'

export type PdfMouseEventHandler = (event: React.MouseEvent, position: Position) => void

function renderPdfToCanvas(canvasEl: HTMLCanvasElement, page: PDFPageProxy, scale: number) {
  const viewport = page.getViewport({ scale })

  canvasEl.width = viewport.width // canvas width and height must be according to viewport scale!
  canvasEl.height = viewport.height

  // console.warn('[PdfCanvas] page.render')
  page.render({
    canvasContext: canvasEl.getContext('2d')!,
    viewport
  })
}

interface PdfCanvasProps {
  page: PDFPageProxy
  scale: number

  onClick?: PdfMouseEventHandler
  onMouseDown?: PdfMouseEventHandler
  onMouseUp?: PdfMouseEventHandler
  onMouseLeave?: PdfMouseEventHandler
  onMouseMove?: PdfMouseEventHandler
}

function PdfCanvas({ page, scale, onClick, onMouseDown, onMouseUp, onMouseLeave, onMouseMove }: PdfCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (ref.current) renderPdfToCanvas(ref.current, page, scale)
  }, [page, scale, ref])

  const getMousePos = (e: React.MouseEvent): Position => {
    const { left, top } = ref.current!.getBoundingClientRect()
    return {
      x: e.clientX - left,
      y: e.clientY - top
    }
  }

  const wrap = (handler: PdfMouseEventHandler | undefined): React.MouseEventHandler | undefined => handler && (event => handler(event, getMousePos(event)))

  return <canvas
    ref={ref}
    onClick={wrap(onClick)}
    onMouseDown={wrap(onMouseDown)}
    onMouseUp={wrap(onMouseUp)}
    onMouseLeave={wrap(onMouseLeave)}
    onMouseMove={wrap(onMouseMove)}
    style={{ cursor: 'crosshair' }}
  />
}

export default PdfCanvas
