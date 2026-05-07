import React, { useRef, useState, useEffect, useContext } from 'react'
import KeyboardEventHandler from 'react-keyboard-event-handler'
import { ModificationContext } from '../../../context/modification-context'

import OverlayItem from './OverlayItem'

import styles from './Overlay.module.scss'

function getRelativeMousePos(element, event) {
  const { left, top } = element.getBoundingClientRect()
  return {
    x: event.clientX - left,
    y: event.clientY - top
  }
}

function Overlay({ items, scale, onItemMove, onItemDelete, onChangeMeasurement, fontSize }) {
  const overlayRef = useRef(null)
  const { nextId } = useContext(ModificationContext)
  const [selectedItemId, setSelectedItemId] = useState(null)
  useEffect(() => setSelectedItemId(nextId - 1), [nextId])

  useEffect(() => {
    if (items.length === 0) {
      setSelectedItemId(null)
    }
  }, [items])

  return (
    <div
      ref={overlayRef}
      className={styles.overlay}
      style={{
        position: selectedItemId !== null ? 'absolute' : null
      }}
      onClick={() => {
        setSelectedItemId(null)
      }}
    >
      <KeyboardEventHandler
        handleKeys={['delete']}
        handleEventType="keyup"
        onKeyEvent={() => {
          if (selectedItemId !== null) {
            onItemDelete(selectedItemId)
            setSelectedItemId(null)
          }
        }}
      />
      {items.map(item => (
        <OverlayItem
          key={item.id}
          position={item.position}
          size={fontSize}
          title={item.title}
          value={item.value}
          scale={scale}
          template={item.template}
          hasContextMenu={!item.disabled}
          onDragEnd={event =>
            onItemMove(
              event,
              getRelativeMousePos(overlayRef.current, event),
              item.id
            )
          }
          isSelected={item.id === selectedItemId}
          onClick={event => {
            setSelectedItemId(item.id)
            event.stopPropagation()
          }}
          onDelete={() => onItemDelete(item.id)}
          onChangeMeasurement={measurement => onChangeMeasurement(item.id, measurement)}
        />
      ))}
    </div>
  )
}

export default Overlay
