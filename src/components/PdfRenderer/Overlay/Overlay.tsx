import React, { useRef, useState, useEffect, useContext } from 'react'
import KeyboardEventHandler from 'react-keyboard-event-handler'

import { ModificationContext, Modification } from '../../../context/modification-context'
import OverlayItem from './OverlayItem'

import styles from './Overlay.module.scss'
import type { Position } from '../../../types'
import type { OverlayProperties } from './OverlayItem'

export type OverlayTemplate = (mod: Modification) => OverlayProperties

function getRelativeMousePos(element: HTMLElement, event: React.MouseEvent) {
  const { left, top } = element.getBoundingClientRect()
  return {
    x: event.clientX - left,
    y: event.clientY - top
  }
}

interface OverlayProps {
  items: Modification[]
  scale: number
  minValue: number
  maxValue: number
  template: OverlayTemplate
  onItemMove(position: Position, id: number): void
  onItemDelete(id: number): void
  onChangeValue(id: number, value: number): void
  onChangeContent(id: number): void
  onChangeMeasurement(id: number, measurement: string): void
  fontSize: number
}

function Overlay({ items, scale, minValue, maxValue, template, onItemMove, onItemDelete, onChangeValue, onChangeContent, onChangeMeasurement, fontSize }: OverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const { nextId } = useContext(ModificationContext)
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null)
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
        position: selectedItemId !== null ? 'absolute' : undefined
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
          value={item.value}
          minValue={minValue}
          maxValue={maxValue}
          scale={scale}
          template={template(item)}
          hasContextMenu={!item.disabled}
          onDragEnd={event =>
            onItemMove(
              getRelativeMousePos(overlayRef.current!, event),
              item.id
            )
          }
          isSelected={item.id === selectedItemId}
          onClick={event => {
            setSelectedItemId(item.id)
            event.stopPropagation()
          }}
          onDelete={() => onItemDelete(item.id)}
          onChangeValue={value => onChangeValue(item.id, value)}
          onChangeContent={() => onChangeContent(item.id)}
          onChangeMeasurement={measurement => onChangeMeasurement(item.id, measurement)}
        />
      ))}
    </div>
  )
}

export default Overlay
