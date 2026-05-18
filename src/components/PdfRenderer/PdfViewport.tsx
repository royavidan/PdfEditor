import React, { CSSProperties, useState } from 'react'
import KeyboardEventHandler from 'react-keyboard-event-handler'

import PdfDoc from './PdfDoc'
import PdfPage from './PdfPage'
import PdfCanvas, { PdfMouseEventHandler } from './PdfCanvas'
import Overlay from './Overlay/Overlay'

import styles from './PdfViewport.module.scss'
import { FileData } from '../../context/file-context'
import type { Modification } from '../../context/modification-context'
import type { Position, SkewBorder } from '../../types'
import type { OverlayTemplate } from './Overlay/Overlay'

interface PdfViewportProps {
  disabled: boolean
  data: FileData | null
  pageNum: number
  scale: number
  overlayItems: Modification[]
  overlayTemplate: OverlayTemplate
  className?: string
  style?: CSSProperties
  onMouseDown?: PdfMouseEventHandler
  onMouseUp?: PdfMouseEventHandler
  onMouseLeave?: PdfMouseEventHandler
  onWheel?: (e: WheelEvent) => void
  onItemMove(position: Position, id: number): void
  onItemDelete(id: number): void
  fontSize: number
  markedPosition: Position | null
  angle: number
  onChangeContent(id: number): void
  onChangeMeasurement(id: number, measurement: string): void
  onSave(): void
  onPageUp(): void
  onPageDown(): void
}

const translateBox = (border: SkewBorder) => {
  const center: Position = { x: (border.diagonal[0].x + border.diagonal[1].x) / 2, y: (border.diagonal[0].y + border.diagonal[1].y) / 2 }
  const diaLen = Math.hypot(border.diagonal[1].x - border.diagonal[0].x, border.diagonal[1].y - border.diagonal[0].y), diaAngle = Math.atan2(border.diagonal[1].y - border.diagonal[0].y, border.diagonal[1].x - border.diagonal[0].x)
  const width = Math.abs(diaLen * Math.cos(diaAngle - border.angle)), height = Math.abs(diaLen * Math.sin(diaAngle - border.angle))
  
  return {
    left: center.x - width / 2,
    top: center.y - height / 2,
    width,
    height,
    transform: `rotate(${border.angle}rad)`,
  }
}

function PdfViewport({
  disabled,
  data,
  pageNum,
  scale,
  overlayItems,
  overlayTemplate,
  className = '',
  style,
  onMouseDown,
  onMouseUp,
  onMouseLeave,
  onWheel,
  onItemMove,
  onItemDelete,
  fontSize,
  markedPosition,
  angle,
  onChangeContent,
  onChangeMeasurement,
  onSave,
  onPageUp,
  onPageDown
}: PdfViewportProps) {
  const [currentMousePos, setCurrentMousePos] = useState<Position | null>(null)
  if (disabled) {
    onMouseUp = onMouseDown = onMouseLeave = () => {}
  }
  const onMouseMove: PdfMouseEventHandler = (event, position) => setCurrentMousePos(position)
  return (
    <div className={`${className} ${styles.viewport}`} style={style}>
      <div className={styles.page}>
        {data !== null ? (
          <PdfDoc data={data}>
            {doc => (
              <PdfPage document={doc} pageNum={pageNum}>
                {page => (
                  <>
                  <KeyboardEventHandler
                    handleKeys={['ctrl+s']}
                    handleEventType="keydown"
                    onKeyEvent={(_, e) => {
                      e.stopPropagation()
                      e.preventDefault()
                      onSave()
                    }}
                  />
                  <KeyboardEventHandler
                    handleKeys={['pageup']}
                    handleEventType="keydown"
                    onKeyEvent={onPageUp}
                  />
                  <KeyboardEventHandler
                    handleKeys={['pagedown']}
                    handleEventType="keydown"
                    onKeyEvent={onPageDown}
                  />
                    <Overlay
                      items={overlayItems}
                      scale={scale}
                      template={overlayTemplate}
                      onItemMove={onItemMove}
                      onItemDelete={onItemDelete}
                      onChangeContent={onChangeContent}
                      onChangeMeasurement={onChangeMeasurement}
                      fontSize={fontSize}
                    />
                    <PdfCanvas page={page} scale={scale} onMouseDown={onMouseDown} onMouseUp={onMouseUp} onMouseLeave={onMouseLeave}
                      onMouseMove={onMouseMove} onWheel={onWheel} />
                    {markedPosition && currentMousePos && (
                      <div className={styles.selectionbox}
                        style={translateBox({ diagonal: [markedPosition, currentMousePos], angle })}
                      />
                    )}
                  </>
                )}
              </PdfPage>
            )}
          </PdfDoc>
        ) : null}
      </div>
    </div>
  )
}

export default PdfViewport
