import React, { Component } from 'react'
import type { Position } from '../../types'
import type { PDFPageProxy } from 'pdfjs-dist'

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

class PdfCanvas extends Component<PdfCanvasProps> {
  private canvasRef: React.RefObject<HTMLCanvasElement>

  constructor(props: PdfCanvasProps) {
    super(props)
    this.canvasRef = React.createRef()
  }

  componentDidMount() {
    const { page, scale } = this.props
    renderPdfToCanvas(this.canvasRef.current!, page, scale)
  }

  componentDidUpdate(prevProps: PdfCanvasProps) {
    const { page, scale } = this.props
    if (page !== prevProps.page || scale !== prevProps.scale) {
      renderPdfToCanvas(this.canvasRef.current!, page, scale)
    }
  }

  // drawDot = event => {
  //   const { x, y } = this.getMousePos(event.clientX, event.clientY)
  //   const canvas = this.canvasRef.current
  //   const ctx = canvas.getContext('2d')
  //   ctx.fillRect(x, y, 2, 2)
  // }

  getMousePos = (x: number, y: number): Position => {
    // get mouse position relative to canvas
    const canvas = this.canvasRef.current!
    const { left, top } = canvas.getBoundingClientRect()
    return {
      x: x - left,
      y: y - top
    }
  }

  render() {
    const { onClick, onMouseDown, onMouseUp, onMouseLeave, onMouseMove } = this.props
    const wrap = (handler: PdfMouseEventHandler | undefined): React.MouseEventHandler | undefined => handler && (event => handler(event, this.getMousePos(event.clientX, event.clientY)))

    return (
      <canvas
        ref={this.canvasRef}
        onClick={wrap(onClick)}
        onMouseDown={wrap(onMouseDown)}
        onMouseUp={wrap(onMouseUp)}
        onMouseLeave={wrap(onMouseLeave)}
        onMouseMove={wrap(onMouseMove)}
        style={{ cursor: 'crosshair' }}
      />
    )
  }
}

export default PdfCanvas
