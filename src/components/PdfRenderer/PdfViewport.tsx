import React, { useState } from 'react'
import KeyboardEventHandler from 'react-keyboard-event-handler'

import GlobalKeyHandler from '../Handlers/GlobalKeyHandler'
import PdfDoc from './PdfDoc'
import PdfPage from './PdfPage'
import PdfCanvas, { PdfMouseEventHandler } from './PdfCanvas'
import Overlay from './Overlay/Overlay'

import styles from './PdfViewport.module.scss'
import { FileData } from '../../context/file-context'
import type { Modification } from '../../context/modification-context'
import type { Position } from '../../types'
import type { OverlayTemplate } from './Overlay/Overlay'

interface PdfViewportProps {
  disabled: boolean
  data: FileData | null
  pageNum: number
  scale: number
  overlayItems: Modification[]
  overlayTemplate: OverlayTemplate
  className?: string
  style?: React.CSSProperties
  onMouseDown?: PdfMouseEventHandler
  onMouseUp?: PdfMouseEventHandler
  onMouseLeave?: PdfMouseEventHandler
  onItemMove(position: Position, id: number): void
  onItemDelete(id: number): void
  fontSize: number
  markedPosition: Position | null
  onChangeContent(id: number): void
  onChangeMeasurement(id: number, measurement: string): void
  onSave(): void
  onPageUp(): void
  onPageDown(): void
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
  onItemMove,
  onItemDelete,
  fontSize,
  markedPosition,
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
                  <GlobalKeyHandler block
                    keys={['ctrl+s']}
                    event="keydown"
                    onClick={onSave}
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
