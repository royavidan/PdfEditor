import React, { useContext } from 'react'
import PropTypes from 'prop-types'

import { PageContext } from '../../context/page-context'

import styles from './Toolbar.module.scss'

interface ToolbarProps {
  disabled: boolean
  scale: number
  initialCounter: number
  setInitialCounter: React.Dispatch<React.SetStateAction<number>>
  counter: number
  onZoomChange(amount: number): void
  onRotate(angle: number): void
  onDownload(): void
  onLoad(): void
  onExport(): void
  onSave(): void
  fontSize: number
  setFontSize: React.Dispatch<React.SetStateAction<number>>
  onChangePageNum: React.ChangeEventHandler<HTMLInputElement>
}

function Toolbar({
  disabled,
  scale,
  initialCounter,
  setInitialCounter,
  counter,
  onZoomChange,
  onRotate,
  onDownload,
  onLoad,
  onExport,
  onSave,
  fontSize,
  setFontSize,
  onChangePageNum
}: ToolbarProps) {
  const { pages, currentPage } = useContext(PageContext)
  const runningLabelText = disabled ? null : (
    <div className={styles.text}>
      Place next running label: {`(${counter})`}
    </div>
  )

  const onFontSizeChange: React.ChangeEventHandler<HTMLInputElement> = event => {
    const input = event.target.value
    const isValidFormat = /^\d+(\.\d)?$/.test(input)

    if (event.target.validity.valid && isValidFormat) {
      const value = parseFloat(input)
      setFontSize(Math.round(value * 2) / 2)
    }
  }

  const onInitialCounterChange: React.ChangeEventHandler<HTMLInputElement> = event => {
    const input = event.target.value
    const value = parseInt(input)
    setInitialCounter(value)
  }

  return (
    <div className={styles.toolbar}>
      <div className={styles.group}>
        <button disabled={disabled} onClick={() => onZoomChange(+0.1)}>
          +
        </button>
        <button disabled={disabled} onClick={() => onZoomChange(-0.1)}>
          -
        </button>
        <input type="text" disabled value={`${(scale * 100).toFixed(0)}%`} />
      </div>
      <div className={styles.group}>
        <button disabled={disabled} onClick={() => onRotate(-90)}>
          Left
        </button>
        <label>Rotate</label>
        <button disabled={disabled} onClick={() => onRotate(+90)}>
          Right
        </button>
      </div>
      <div className={styles.group}>
        <input
          type="number"
          title="Font size"
          value={fontSize}
          onChange={onFontSizeChange}
          disabled={disabled}
          min="1"
          max="400"
          step="any"
        />
      </div>

      <button disabled={disabled} onClick={onLoad}>
        Load
      </button>
      <button disabled={disabled} onClick={onDownload}>
        Download
      </button>
      <button disabled={disabled} onClick={onExport}>
        Export
      </button>
      <button disabled={disabled} onClick={onSave}>
        Save
      </button>
      <div className={styles.group}>
        <div className={styles.text}>
          Initial counter
        </div>
        <input
          type="number"
          title="Initial Label"
          value={initialCounter}
          onChange={onInitialCounterChange}
          step="1"
          disabled={!disabled}
        />
        {runningLabelText}
      </div>

      <div className={styles.group}>
        <div className={styles.text}>Page: </div>
        <input
          style={{ width: '2em' }}
          type="number"
          title="Page Number"
          value={currentPage + 1}
          step="1"
          onChange={onChangePageNum}
          min={1}
          max={pages}
          disabled={disabled}
        />
        <div className={styles.text}>{` / ${pages}`}</div>
      </div>
    </div>
  )
}

Toolbar.propTypes = {
  disabled: PropTypes.bool,
  scale: PropTypes.number,
  initialCounter: PropTypes.number,
  setInitialCounter: PropTypes.func,
  counter: PropTypes.number,
  onZoomChange: PropTypes.func,
  onRotate: PropTypes.func,
  onDownload: PropTypes.func,
  onLoad: PropTypes.func,
  onExport: PropTypes.func,
  onSave: PropTypes.func,
  fontSize: PropTypes.number,
  setFontSize: PropTypes.func,
  onChangePageNum: PropTypes.func
}

export default Toolbar
