import React, { useState, useEffect } from 'react'

import styles from './Overlay.module.css'

function OverlayItem({
  position,
  size,
  title,
  value,
  scale,
  template,
  isSelected,
  hasContextMenu,
  onDelete,
  onChangeMeasurement,
  ...otherProps
}) {
  const [contextMenu, setContextMenu] = useState(null)
  const [showSubMenu, setShowSubMenu] = useState(false)

  const closeContextMenu = () => {
    setContextMenu(null)
    setShowSubMenu(false)
  }

  useEffect(() => {
    if (contextMenu !== null) {
      document.addEventListener('click', closeContextMenu)
      document.addEventListener('contextmenu', closeContextMenu)
    }
    return () => {
      document.removeEventListener('click', closeContextMenu)
      document.removeEventListener('contextmenu', closeContextMenu)
    }
  }, [contextMenu])

  const handleContextMenu = (e) => {
    e.preventDefault()
    e.stopPropagation()
    hasContextMenu && setContextMenu({ x: e.clientX, y: e.clientY })
  }

  return (
    <>
      <div
        className={`${styles.item} ${isSelected ? styles.selected : ''}`}
        style={{
          left: `${(position.x - size / 2) * scale}px`,
          top: `${(position.y - size / 2) * scale}px`,
          fontSize: `${size * scale}px`
        }}
        draggable={isSelected}
        title={isSelected ? title : null}
        onContextMenu={handleContextMenu}
        {...otherProps}
      >
        {template(value)}
      </div>
      {contextMenu && (
        <div className={styles.contextmenu}
          style={{
            top: contextMenu.y,
            left: contextMenu.x
          }}
          onClick={e => e.stopPropagation()}
          onContextMenu={e => {
            e.preventDefault()
            e.stopPropagation()
          }}
        >
          <div
            className={styles.contextbutton}
            onClick={() => {
              closeContextMenu()
              onDelete()
            }}
            onMouseEnter={() => setShowSubMenu(false)}>
            Delete
          </div>
          <div
            className={styles.contextbutton}
            onMouseEnter={() => setShowSubMenu(true)}>
            Change Measurement {String.fromCharCode(showSubMenu ? 9654 : 9660)}
            {showSubMenu && (
              <div className={styles.contextsubmenu} ref={ref => ref && (ref.style.top = `${Math.min(0, window.innerHeight - ref.getBoundingClientRect().bottom) - 1}px`)}>
                {['TAP', 'MATERIAL', 'COATING', 'PAINTING', 'HEAT TREATMENT', 'MARKING', 'SURFACE TEXTURE', 'REMOVE BURRS'].map(measurement => (
                  <div
                    key={measurement}
                    className={styles.contextbutton}
                    onClick={() => {
                      closeContextMenu()
                      onChangeMeasurement(measurement)
                    }}>
                    {measurement}
                  </div>
                ))}
                <div
                  key='CUSTOM'
                  className={styles.contextbutton}
                  onClick={() => {
                    closeContextMenu()
                    const measurement = window.prompt('Enter custom measurement')
                    measurement && onChangeMeasurement(measurement.toUpperCase())
                  }}>
                  CUSTOM
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default React.memo(OverlayItem)
