import React, { useState } from 'react'
import KeyboardEventHandler from 'react-keyboard-event-handler'

import PdfDoc from './PdfDoc'
import PdfPage from './PdfPage'
import PdfCanvas, { PdfMouseEventHandler } from './PdfCanvas'
import Overlay from './Overlay/Overlay'

import styles from './PdfViewport.module.scss'
import { FileData } from '../../context/file-context'
import type { Position } from '../../types'

interface PdfViewportProps {
  data: FileData
  pageNum: number
  scale: number
  overlayItems: Modification[]
  className?: string
  style?: React.CSSProperties
  onMouseDown?: PdfMouseEventHandler
  onMouseUp?: PdfMouseEventHandler
  onMouseLeave?: PdfMouseEventHandler
  onItemMove(position: Position, id: number): void
  onItemDelete(id: number): void
  fontSize: number
  markedPosition: Position | null
  onChangeMeasurement(id: number, measurement: string): void
  onSave(): void
}

function PdfViewport({
  data,
  pageNum,
  scale,
  overlayItems,
  className = '',
  style,
  onMouseDown,
  onMouseUp,
  onMouseLeave,
  onItemMove,
  onItemDelete,
  fontSize,
  markedPosition,
  onChangeMeasurement,
  onSave
}: PdfViewportProps) {
  const [currentMousePos, setCurrentMousePos] = useState<Position | null>(null)
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
                    <Overlay
                      items={overlayItems}
                      scale={scale}
                      onItemMove={onItemMove}
                      onItemDelete={onItemDelete}
                      onChangeMeasurement={onChangeMeasurement}
                      fontSize={fontSize}
                    />
                    <PdfCanvas page={page} scale={scale} onMouseDown={onMouseDown} onMouseUp={onMouseUp} onMouseLeave={onMouseLeave}
                      onMouseMove={onMouseMove} />
                    {markedPosition && currentMousePos && (
                      <div className={styles.selectionbox}
                        style={{
                          left: Math.min(markedPosition.x, currentMousePos.x),
                          top: Math.min(markedPosition.y, currentMousePos.y),
                          width: Math.abs(markedPosition.x - currentMousePos.x),
                          height: Math.abs(markedPosition.y - currentMousePos.y)
                        }}
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
