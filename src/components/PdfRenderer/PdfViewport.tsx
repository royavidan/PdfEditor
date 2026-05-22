import React, { useState } from 'react'

import GlobalKeyHandler from '../Handlers/GlobalKeyHandler'
import PdfDoc from './PdfDoc'
import PdfPage from './PdfPage'
import PdfCanvas, { type PdfMouseEventHandler } from './PdfCanvas'
import Overlay from './Overlay/Overlay'

import styles from './PdfViewport.module.scss'
import type { FileData } from '../../context/file-context'
import type { Modification } from '../../context/modification-context'
import type { Position } from '../../types'
import type { OverlayTemplate } from './Overlay/Overlay'

interface PdfViewportProps {
  disabled: boolean
  data: FileData | null
  pageNum: number
  scale: number
  minValue: number
  maxValue: number
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
  onChangeValue(id: number, value: number): void
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
  minValue,
  maxValue,
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
  onChangeValue,
  onChangeContent,
  onChangeMeasurement,
  onSave,
  onPageUp,
  onPageDown
}: PdfViewportProps) {
  const [currentMousePos, setCurrentMousePos] = useState<Position | null>(null)
  const wrap = (e?: PdfMouseEventHandler) => disabled ? (() => {}) : e
  const onMouseMove: PdfMouseEventHandler = (_event, position) => setCurrentMousePos(position)

  const onKeyDown: React.KeyboardEventHandler = e => {
    switch (e.key) {
      case 'PageUp':
        onPageUp()
        break
      case 'PageDown':
        onPageDown()
        break
    }
  }
  return (
    <div className={`${className} ${styles.viewport}`} style={style}>
      <div className={styles.page}>
        {data !== null ? (
          <PdfDoc data={data}>
            {doc => (
              <PdfPage document={doc} pageNum={pageNum}>
                {page => (
                  <div tabIndex={-1} onKeyDown={onKeyDown}>
                  <GlobalKeyHandler block
                    keys={['ctrl+s']}
                    event="keydown"
                    onClick={onSave}
                  />
                    <Overlay
                      items={overlayItems}
                      scale={scale}
                      minValue={minValue}
                      maxValue={maxValue}
                      template={overlayTemplate}
                      onItemMove={onItemMove}
                      onItemDelete={onItemDelete}
                      onChangeValue={onChangeValue}
                      onChangeContent={onChangeContent}
                      onChangeMeasurement={onChangeMeasurement}
                      fontSize={fontSize}
                    />
                    <PdfCanvas page={page} scale={scale} onMouseDown={wrap(onMouseDown)} onMouseUp={wrap(onMouseUp)} onMouseLeave={wrap(onMouseLeave)}
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
                  </div>
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
