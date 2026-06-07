import { useState, useContext } from 'react'
import { saveAs } from 'file-saver'

import { compactMods, tryLoadMods } from './file-logic'
import { FileContext, type FileData } from '../../context/file-context'
import { ViewportContext } from '../../context/viewport-context'
import { CounterContext } from '../../context/counter-context'
import { ModificationContext } from '../../context/modification-context'
import { SettingsContext } from '../../context/settings-context'
import type { ControllerProps } from '../../types'

interface LoadDialogControllerData {
  showDialog: boolean
  openDialog(): void
  closeDialog(): void
  onLoad(data: FileData, name: string): void
  onSave(): void
  isAtReload(): boolean
}

function LoadDialogController({ children }: ControllerProps<LoadDialogControllerData>) {
  const [showDialog, setShowDialog] = useState(true)
  const { data: fileData, isFileLoaded, setData: setFileData, name: fileName, setName: setFileName } = useContext(FileContext)
  const { resetScale } = useContext(ViewportContext)
  const { resetCounter, incrementCounter } = useContext(CounterContext)
  const { resetModList, addMod, modList } = useContext(ModificationContext)
  const { resetSettings } = useContext(SettingsContext)

  const onLoad = (data: FileData, name: string) => {
    setFileName(name)
    setShowDialog(false)
    const loadedContent = tryLoadMods(data)
    setFileData(loadedContent.data)
    resetScale()
    resetCounter()
    resetModList()
    resetSettings()
    
    if (loadedContent.modList) {
      loadedContent.modList.forEach((m, i) => addMod(m, i))
      incrementCounter(loadedContent.modList.length)
    }
  }

  const onSave = async () => {
    saveAs(compactMods(fileData!, modList), `${(fileName || 'scan.pdf').replace('.pdf', ' - in progress.pdf')}`)
  }

  return children({
    showDialog,
    openDialog: () => setShowDialog(true),
    closeDialog: () => setShowDialog(false),
    onLoad,
    onSave,
    isAtReload: () => isFileLoaded() && showDialog
  })
}

export default LoadDialogController
