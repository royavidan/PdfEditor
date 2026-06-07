import { useContext, useState } from 'react'

import styles from './Settings.module.scss'
import { SettingsContext } from '../../context/settings-context'
import { arrayIsEqual } from '../../utils'

function Settings() {
    const { doubleBloonsOnTap, setDoubleBloonsOnTap, fontSize, setFontSize, initialCounter, setInitialCounter, defaultXlsmName, setDefaultXlsmName, showSettings, closeSettings } = useContext(SettingsContext)
    
    const [doubleBloonsOnTapValue, setDoubleBloonsOnTapValue] = useState(doubleBloonsOnTap)
    const [fontSizeValue, setFontSizeValue] = useState(fontSize)
    const [initialCounterValue, setInitialCounterValue] = useState(initialCounter)
    const [defaultXlsmNameValue, setDefaultXlsmNameValue] = useState(defaultXlsmName)
    
    if (!showSettings) return null

    const handleSave = () => {
        setDoubleBloonsOnTap(doubleBloonsOnTapValue)
        setFontSize(fontSizeValue)
        setInitialCounter(initialCounterValue)
        setDefaultXlsmName(defaultXlsmNameValue)
        
        closeSettings()
    }

    const hasChanges = () => !arrayIsEqual([doubleBloonsOnTap, fontSize, initialCounter, defaultXlsmName], [doubleBloonsOnTapValue, fontSizeValue, initialCounterValue, defaultXlsmNameValue])

    return (
        <div className={styles.overlay}>
            <div className={styles.popup}>
                <h2 className={styles.title}>Settings</h2>
                
                <div className={styles.row}>
                    <label className={styles.label}>Double Bloons on Tap</label>
                    <label className={styles.switch}>
                        <input onChange={e => setDoubleBloonsOnTapValue(e.target.checked)}
                            type="checkbox"
                            defaultChecked={doubleBloonsOnTap} 
                        />
                        <span className={styles.slider}></span>
                    </label>
                </div>

                <div className={styles.row}>
                    <label className={styles.label}>Font Size</label>
                    <input onChange={e => setFontSizeValue(parseInt(e.target.value))}
                        type="number" 
                        className={styles.numberInput} 
                        defaultValue={fontSize} 
                        min="1"
                    />
                </div>

                <div className={styles.row}>
                    <label className={styles.label}>Initial Counter</label>
                    <input onChange={e => setInitialCounterValue(parseInt(e.target.value))}
                        type="number" 
                        className={styles.numberInput} 
                        defaultValue={initialCounter}
                    />
                </div>

                <div className={styles.row}>
                    <label className={styles.label}>Default XLSM Name</label>
                    <input onChange={e => setDefaultXlsmNameValue(e.target.value)}
                        dir="auto"
                        type="text" 
                        className={styles.textInput}
                        defaultValue={defaultXlsmName}
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