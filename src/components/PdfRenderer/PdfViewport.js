import React from 'react'
import PdfDoc from './PdfDoc'
import PdfPage from './PdfPage'
import PdfCanvas from './PdfCanvas'
import Overlay from './Overlay/Overlay'

import styles from './PdfViewport.module.css'

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
  const [currentMousePos, setCurrentMousePos] = React.useState(null)
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
