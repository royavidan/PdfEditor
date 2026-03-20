import React, { useContext, useState } from 'react'
import PdfDoc from './PdfDoc'
import PdfPage from './PdfPage'
import PdfCanvas from './PdfCanvas'
import Overlay from './Overlay/Overlay'

import styles from './PdfViewport.module.css'
import { PDFContext } from '../../context/pdf-context'

function getMarkingBoxes(text, symbols) {
  const boxes = []

  // text.forEach((item, index) => boxes.push(<div key={index} className={styles.markingbox} style={{
  //   width: `${item.width}px`,
  //   height: `${item.height}px`,
  //   transform: `translate(${item.left}px, ${item.top}px) rotate(${item.angle}rad)`
  // }} />))

  // for (const [symbol, matches] of Object.entries(symbols)) {
  //   matches.forEach((item, index) => boxes.push(<div key={`${symbol}-${index}`} className={styles.markingbox} style={{
  //     width: `${item.width}px`,
  //     height: `${item.height}px`,
  //     transform: `translate(${item.left}px, ${item.top}px) rotate(${item.angle}rad)`
  //   }}/>))
  // }

  symbols.phi.forEach((item, index) => boxes.push(<div key={`phi-${index}-circle`} className={styles.markingbox} style={{
    borderRadius: '50%',
    width: `${item.circle.width}px`,
    height: `${item.circle.height}px`,
    transform: `translate(${item.circle.left}px, ${item.circle.top}px)`
  }}/>, <div key={`phi-${index}-line`} className={styles.markingbox} style={{
    width: Math.hypot(item.line.width, item.line.height),
    transformOrigin: 'top left',
    transform: `translate(${item.line[0].x}px, ${item.line[0].y}px) rotate(${Math.atan2(item.line[1].y - item.line[0].y, item.line[1].x - item.line[0].x)}rad)`
  }}/>))

  return boxes
}

function PdfViewport({
  data,
  pageNum,
  scale,
  overlayItems,
  className = '',
  style,
  onClick,
  onItemMove,
  onItemDelete,
  fontSize,
  markedPosition
}) {
  const [currentMousePos, setCurrentMousePos] = useState(null)
  const [selectionBox, setSelectionBox] = useState(null)
  const { text, symbols, isLoaded } = useContext(PDFContext)
  if (data && isLoaded() && !selectionBox) setSelectionBox(getMarkingBoxes(text, symbols)) //TODO: for debugging purposes
  return (
    <div className={`${className} ${styles.viewport}`} style={style}>
      <div className={styles.page}>
        {data !== null ? (
          <PdfDoc data={data}>
            {doc => (
              <PdfPage document={doc} pageNum={pageNum}>
                {page => (
                  <React.Fragment>
                    <Overlay
                      items={overlayItems}
                      scale={scale}
                      onItemMove={onItemMove}
                      onItemDelete={onItemDelete}
                      fontSize={fontSize}
                      markedPosition={markedPosition}
                    />
                    <PdfCanvas page={page} scale={scale} onClick={onClick}
                      onMouseMove={(event, position) => setCurrentMousePos(position)} />
                    {selectionBox}
                    {markedPosition && currentMousePos && (
                      <div className={styles.selectionbox}
                        style={{
                          position: 'absolute',
                          background: '#b3e5fc',
                          border: '1px solid #01579b',
                          pointerEvents: 'none',
                          opacity: 0.5,
                          left: Math.min(markedPosition.x, currentMousePos.x),
                          top: Math.min(markedPosition.y, currentMousePos.y),
                          width: Math.abs(markedPosition.x - currentMousePos.x),
                          height: Math.abs(markedPosition.y - currentMousePos.y)
                        }}
                      />
                    )}
                  </React.Fragment>
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
