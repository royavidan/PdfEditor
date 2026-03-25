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

  for (const [symbol, matches] of Object.entries(symbols)) {
    matches.forEach((item, index) => boxes.push(<div key={`${symbol}-${index}`} className={styles.markingbox} style={{
      width: `${item.width}px`,
      height: `${item.height}px`,
      transform: `translate(${item.left}px, ${item.top}px) rotate(${item.angle}rad)`
    }}/>))
  }

  const circleDiv = (circle, key) => <div key={key} className={styles.markingbox} style={{
    borderRadius: '50%',
    width: `${circle.width}px`,
    height: `${circle.height}px`,
    transform: `translate(${circle.left}px, ${circle.top}px)`
  }}/>
  const lineDiv = (line, key) => <div key={key} className={styles.markingbox} style={{
    width: Math.hypot(line.width, line.height),
    transformOrigin: 'top left',
    transform: `translate(${line[0].x}px, ${line[0].y}px) rotate(${Math.atan2(line[1].y - line[0].y, line[1].x - line[0].x)}rad)`
  }}/>

  // symbols.diameter.forEach((item, index) => boxes.push(circleDiv(item.circle, `diameter-${index}-circle`), lineDiv(item.line, `phi-${index}-line`)))
  // symbols.position.forEach((item, index) => boxes.push(circleDiv(item.circle, `position-${index}-circle`), lineDiv(item.horizontal, `position-${index}-horizontal`), lineDiv(item.vertical, `position-${index}-vertical`)))

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
  const { text, symbols, isLoaded, setMousePos } = useContext(PDFContext)
  const onMouseMove = (event, position) => {
    setCurrentMousePos(position)
    setMousePos(position)
  }
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
                      onMouseMove={onMouseMove} />
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
