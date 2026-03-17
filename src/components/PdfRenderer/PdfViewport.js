import React, { useState } from 'react'
import PdfDoc from './PdfDoc'
import PdfPage from './PdfPage'
import PdfCanvas from './PdfCanvas'
import Overlay from './Overlay/Overlay'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf'

import styles from './PdfViewport.module.css'

/**
 * Parses a PDF and returns an array of styled React <div> elements 
 * that visually map the exact area and rotation of every text item.
 * * @param {Uint8Array | ArrayBuffer} binaryPdfData - The PDF file content.
 * @param {number} pageNumber - The page to extract from (defaults to 1).
 * @returns {Promise<Array<JSX.Element>>} Array of styled <div> elements.
 */
export async function generateTextOverlays(binaryPdfData, cls, pageNumber = 1) {
  console.log('tettt')
  const loadingTask = pdfjsLib.getDocument({ data: binaryPdfData });
  const pdfDocument = await loadingTask.promise;
  const page = await pdfDocument.getPage(pageNumber);

  const viewport = page.getViewport({ scale: 1 });
  const pageHeight = viewport.height;

  const textContent = await page.getTextContent({ includeMarkedContent: true });
  const divElements = [];

  textContent.items.forEach((item, index) => {
    // Transform matrix: [scaleX, skewY, skewX, scaleY, translateX, translateY]
    const [a, b, c, d, e, f] = item.transform;

    // 1. Calculate the rotation angle
    // Math.atan2 returns radians. We multiply by (180 / Math.PI) for degrees.
    // We make it negative because CSS rotates clockwise, PDF rotates counter-clockwise.
    const angleDeg = -Math.atan2(b, a) * (180 / Math.PI);

    // 2. Map coordinates to a top-left DOM system using translate
    // 'e' is the X position. 'f' is the bottom-left Y position.
    const translateX = e;
    
    // We subtract item.height because CSS top/left naturally targets the top-left corner, 
    // but we need to shift our box up so its bottom aligns with the PDF's bottom-left origin.
    const translateY = pageHeight - f - item.height;

    // 3. Construct the CSS
    const style = {
      top: 0,
      left: 0,
      width: `${item.width}px`,
      height: `${item.height}px`,
      transformOrigin: 'bottom left',
      transform: `translate(${translateX}px, ${translateY}px) rotate(${angleDeg}deg)`,
      pointerEvents: 'none'
    };

    divElements.push(
      <div key={index} className={cls} style={style}/>
    );
  });

  return divElements;
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
  if (data && !selectionBox) generateTextOverlays(data, styles.markingbox).then(setSelectionBox)
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
