import React, { useContext, useRef } from 'react'

import styles from './Settings.module.css'
import { SettingsContext } from '../../context/settings-context'

function Settings() {
    const { doubleBloonsOnTap, setDoubleBloonsOnTap, fontSize, setFontSize, initialCounter, setInitialCounter, showSettings, closeSettings } = useContext(SettingsContext)
    
    const doubleBloonsOnTapRef = useRef(null)
    const fontSizeRef = useRef(null)
    const initialCounterRef = useRef(null)
    
    if (!showSettings) return null

    const handleSave = () => {
        setDoubleBloonsOnTap(doubleBloonsOnTapRef.current.checked)
        setFontSize(parseInt(fontSizeRef.current.value))
        setInitialCounter(parseInt(initialCounterRef.current.value))
        
        closeSettings()
    }

    const hasChanges = () => doubleBloonsOnTap !== doubleBloonsOnTapRef.current?.checked ||
            fontSize !== parseInt(fontSizeRef.current?.value) ||
            initialCounter !== parseInt(initialCounterRef.current?.value)

    return (
        <div className={styles.overlay}>
            <div className={styles.popup}>
                <h2 className={styles.title}>Settings</h2>
                
                <div className={styles.row}>
                    <label className={styles.label}>Double Bloons on Tap</label>
                    <label className={styles.switch}>
                        <input ref={doubleBloonsOnTapRef}
                            type="checkbox" 
                            defaultChecked={doubleBloonsOnTap} 
                        />
                        <span className={styles.slider}></span>
                    </label>
                </div>

                <div className={styles.row}>
                    <label className={styles.label}>Font Size</label>
                    <input ref={fontSizeRef}
                        type="number" 
                        className={styles.numberInput} 
                        defaultValue={fontSize} 
                        min="1"
                    />
                </div>

                <div className={styles.row}>
                    <label className={styles.label}>Initial Counter</label>
                    <input ref={initialCounterRef}
                        type="number" 
                        className={styles.numberInput} 
                        defaultValue={initialCounter}
                    />
                </div>

                <div className={styles.actions}>
                    <button className={styles.cancelButton} onClick={closeSettings}>Cancel</button>
                    <button className={styles.saveButton} disabled={!hasChanges()} onClick={handleSave}>Save</button>
                </div>
            </div>
        </div>
    )
}

export default Settings