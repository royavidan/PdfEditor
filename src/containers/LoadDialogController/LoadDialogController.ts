import { useState, useContext } from 'react'
import { saveAs } from 'file-saver'
import PropTypes from 'prop-types'

import { arrayIsEqual } from '../../utils'
import { FileContext, FileData } from '../../context/file-context'
import { ViewportContext } from '../../context/viewport-context'
import { CounterContext } from '../../context/counter-context'
import { ModificationContext, Modification } from '../../context/modification-context'
import type { ControllerProps } from '../../types'

const EOF = [...'%%EOF'].map(c => c.charCodeAt(0))

interface LoadDialogControllerData {
  showDialog: boolean
  openDialog(): void
  closeDialog(): void
  onLoad(data: FileData): void
  onSave(): void
  isAtReload(): boolean
}

function LoadDialogController({ children }: ControllerProps<LoadDialogControllerData>) {
  const [showDialog, setShowDialog] = useState(true)
  const { data: fileData, isFileLoaded, setData: setFileData } = useContext(FileContext)
  const { resetScale } = useContext(ViewportContext)
  const { resetCounter, incrementCounter } = useContext(CounterContext)
  const { resetModList, addMod, modList } = useContext(ModificationContext)

  const onLoad = async (data: FileData) => {
    setShowDialog(false)
    let pdfData: FileData = data, newModList: Modification[] | null = null
    const arrData = new Uint8Array(data)
    let eofIndex = arrData.length - EOF.length
    while (!arrayIsEqual(arrData.slice(eofIndex, eofIndex + EOF.length), EOF)) eofIndex--
    eofIndex += EOF.length
    if (eofIndex < arrData.length) {
      pdfData = arrData.slice(0, eofIndex).buffer
      try {
        newModList = JSON.parse(atob(String.fromCharCode(...arrData.slice(eofIndex))))
        PropTypes.checkPropTypes(Modification, newModList, '<load>', 'LoadDialogController')
      } catch {}
    }
    setFileData(pdfData)
    resetScale()
    resetCounter()
    resetModList()
    
    if (newModList) {
      newModList.forEach((m, i) => addMod(m, i))
      incrementCounter(newModList.length)
    }
  }

  const onSave = async () => {
    const blob = new Blob([fileData!, btoa(JSON.stringify(modList))], { type: 'application/pdf' })
    saveAs(blob, 'דוח ביקורת - עם בלונים.pdf')
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
