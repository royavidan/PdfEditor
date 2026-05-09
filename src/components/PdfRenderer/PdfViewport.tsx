import React, { useState } from 'react'
import KeyboardEventHandler from 'react-keyboard-event-handler'
import PropTypes from 'prop-types'

import PdfDoc from './PdfDoc'
import PdfPage from './PdfPage'
import PdfCanvas, { PdfMouseEventHandler } from './PdfCanvas'
import Overlay from './Overlay/Overlay'

import styles from './PdfViewport.module.scss'
import { FileData } from '../../context/file-context'
import { Modification } from '../../context/modification-context'
import { Position, Null } from '../../types'
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

PdfViewport.propTypes = {
  disabled: PropTypes.bool.isRequired,
  data: PropTypes.oneOfType([Null, FileData]),
  pageNum: PropTypes.number.isRequired,
  scale: PropTypes.number.isRequired,
  overlayItems: PropTypes.arrayOf(Modification).isRequired,
  className: PropTypes.string,
  style: PropTypes.object,
  onMouseDown: PropTypes.func,
  onMouseUp: PropTypes.func,
  onMouseLeave: PropTypes.func,
  onItemMove: PropTypes.func,
  onItemDelete: PropTypes.func,
  fontSize: PropTypes.number.isRequired,
  markedPosition: PropTypes.oneOfType([Null, Position]),
  onChangeMeasurement: PropTypes.func,
  onSave: PropTypes.func
}

export default PdfViewport
