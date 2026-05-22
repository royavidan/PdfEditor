import React, { useRef, useEffect } from 'react'
import { type PDFPageProxy } from 'pdfjs-dist'

import type { Position } from '../../types'

export type PdfMouseEventHandler = (event: React.MouseEvent, position: Position) => void

function renderPdfToCanvas(canvasEl: HTMLCanvasElement, page: PDFPageProxy, scale: number) {
  const viewport = page.getViewport({ scale })

  canvasEl.width = viewport.width // canvas width and height must be according to viewport scale!
  canvasEl.height = viewport.height

  // console.warn('[PdfCanvas] page.render')
  return page.render({
    canvas: canvasEl,
    // canvasContext: canvasEl.getContext('2d')!,
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
    if (ref.current) {
      const task = renderPdfToCanvas(ref.current, page, scale)
      return () => {
        task.promise.catch(() => {})
        task.cancel()
      }
    }
  }, [page, scale, ref])

  const getMousePos = (e: React.MouseEvent): Position => {
    const { left, top } = ref.current!.getBoundingClientRect()
    return {
      x: e.clientX - left,
      y: e.clientY - top
    }
  }

  return <canvas
    ref={ref}
    onClick={onClick && (e => onClick(e, getMousePos(e)))}
    onMouseDown={onMouseDown && (e => onMouseDown(e, getMousePos(e)))}
    onMouseUp={onMouseUp && (e => onMouseUp(e, getMousePos(e)))}
    onMouseLeave={onMouseLeave && (e => onMouseLeave(e, getMousePos(e)))}
    onMouseMove={onMouseMove && (e => onMouseMove(e, getMousePos(e)))}
    style={{ cursor: 'crosshair' }}
  />
}

export default PdfCanvas
