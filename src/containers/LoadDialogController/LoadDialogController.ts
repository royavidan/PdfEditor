import { useState, useContext } from 'react'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'

import { FileContext, FileData } from '../../context/file-context'
import { ViewportContext } from '../../context/viewport-context'
import { CounterContext } from '../../context/counter-context'
import { ModificationContext, Modification } from '../../context/modification-context'
import { BloonsContext, Bloon } from '../../context/bloons-context'
import type { ControllerProps } from '../../types'

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
  const { resetBloons, addBloon, bloons } = useContext(BloonsContext)

  const onLoad = async (data: FileData) => {
    setShowDialog(false)
    try {
      const zip = await JSZip.loadAsync(data)
      const pdfData = await zip.file('input.pdf')!.async('arraybuffer')
      const modList: Modification[] = JSON.parse(await zip.file('modifications.json')!.async('string'))
      const bloons: Record<number, Bloon> = JSON.parse(await zip.file('bloons.json')!.async('string'))

      setFileData(pdfData)
      resetScale()
      resetCounter()
      resetModList()
      resetBloons()
      modList.forEach((m, i) => {
        m.template = value => `(${value})`
        addMod(m, i)
      })
      Object.entries(bloons).forEach(([id, bloon]) => addBloon(Number(id), bloon))
      incrementCounter(modList.length)
    } catch {
      setFileData(data)
      resetScale()
      resetCounter()
      resetModList()
      resetBloons()
    }
  }

  const onSave = async () => {
    const zip = new JSZip()
    zip.file('input.pdf', fileData!)
    zip.file('modifications.json', JSON.stringify(modList))
    zip.file('bloons.json', JSON.stringify(bloons))
    const blob = new Blob([await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })], { type: 'application/zip' })
    saveAs(blob, 'output.bloons')
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
