import React, { useState, useEffect, useRef } from 'react'

import styles from './Overlay.module.scss'
import type { Position } from '../../../types'

export interface OverlayProperties {
  title: string
  content: string
}

interface OverlayItemsProps {
  position: Position
  size: number
  value: number
  minValue: number
  maxValue: number
  scale: number
  template: OverlayProperties
  isSelected: boolean
  hasContextMenu: boolean
  onDelete(): void
  onChangeValue(value: number): void
  onChangeContent(): void
  onChangeMeasurement(measurement: string): void
}

function OverlayItem({
  position,
  size,
  // value,
  minValue,
  maxValue,
  scale,
  template,
  isSelected,
  hasContextMenu,
  onDelete,
  onChangeValue,
  onChangeContent,
  onChangeMeasurement,
  ...otherProps
}: OverlayItemsProps & React.HTMLAttributes<HTMLDivElement>) {
  const [contextMenu, setContextMenu] = useState<Position | null>(null)
  const [showSubMenu, setShowSubMenu] = useState(false)
  const changeValueInputRef = useRef<HTMLInputElement>(null)

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
    if (hasContextMenu) setContextMenu({ x: e.clientX, y: e.clientY })
  }

  return (
    <>
      <div
        ref={r => { if (r && isSelected) r.parentElement!.focus(); }}
        className={`${styles.item} ${isSelected ? styles.selected : ''}`}
        style={{
          left: `${(position.x - size / 2) * scale}px`,
          top: `${(position.y - size / 2) * scale}px`,
          fontSize: `${size * scale}px`
        }}
        draggable={isSelected}
        title={isSelected ? template.title : undefined}
        onContextMenu={handleContextMenu}
        {...otherProps}
      >
        {template.content}
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
            onClick={
              () => {
                closeContextMenu()
                onChangeContent()
              }
            }
            onMouseEnter={() => setShowSubMenu(false)}>
            Change Content
          </div>
          <div
            className={styles.contextbutton}
            onClick={
              () => {
                closeContextMenu()
                onChangeValue(parseInt(changeValueInputRef.current!.value))
              }
            }
            onMouseEnter={() => setShowSubMenu(false)}>
              Change Value to <input ref={changeValueInputRef} type="number" min={minValue} max={maxValue}/>
          </div>
          <div
            className={styles.contextbutton}
            onMouseEnter={() => setShowSubMenu(true)}>
            Change Measurement {String.fromCharCode(showSubMenu ? 9654 : 9660)}
            {showSubMenu && (
              <div className={styles.contextsubmenu} ref={ref => {
                if (ref) ref.style.top = `${Math.min(0, window.innerHeight - ref.getBoundingClientRect().bottom) - 1}px`
              }}>
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
                    if (measurement) onChangeMeasurement(measurement.toUpperCase())
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
