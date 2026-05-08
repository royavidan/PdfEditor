import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'

import styles from './Overlay.module.scss'
import { Position } from '../../../types'

interface OverlayItemsProps {
  position: Position
  size: number
  title: string
  value: number
  scale: number
  template(value: number): string
  isSelected: boolean
  hasContextMenu: boolean
  onDelete(): void
  onChangeMeasurement(measurement: string): void
}

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
}: OverlayItemsProps & React.HTMLAttributes<HTMLDivElement>) {
  const [contextMenu, setContextMenu] = useState<Position | null>(null)
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

  const handleContextMenu: React.MouseEventHandler = e => {
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
        title={isSelected ? title : undefined}
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

OverlayItem.propTypes = {
  position: Position.isRequired,
  size: PropTypes.number.isRequired,
  title: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  scale: PropTypes.number.isRequired,
  template: PropTypes.func.isRequired,
  isSelected: PropTypes.bool.isRequired,
  hasContextMenu: PropTypes.bool.isRequired,
  onDelete: PropTypes.func.isRequired,
  onChangeMeasurement: PropTypes.func.isRequired
}

export default React.memo(OverlayItem)
