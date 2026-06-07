import { useContext } from 'react'

import { exportBloons, download, rotate } from './toolbar-logic'
import { FileContext } from '../../context/file-context'
import { ViewportContext } from '../../context/viewport-context'
import { CounterContext } from '../../context/counter-context'
import { ModificationContext } from '../../context/modification-context'
import { PageContext } from '../../context/page-context'
import { PDFContext } from '../../context/pdf-context'
import { SettingsContext } from '../../context/settings-context'
import type { ControllerProps } from '../../types'

interface ToolbarControllerData {
  disabled: boolean
  scale: number
  onZoomChange(amount: number): void
  onRotate(angle: number): void
  counter: number
  onDownload(): void
  onExport(): void
  onSettings(): void
  onChangePageNum: React.ChangeEventHandler<HTMLInputElement>
}

function ToolbarController({ children }: ControllerProps<ToolbarControllerData>) {
  const { data: fileData, isFileLoaded, setData: setFileData, name: fileName } = useContext(
    FileContext
  )
  const { scale, setScale } = useContext(ViewportContext)
  const { counter, resetCounter } = useContext(CounterContext)
  const { modList, resetModList } = useContext(ModificationContext)
  const { currentPage, setPage, pages } = useContext(PageContext)
  const { getLoadedPages } = useContext(PDFContext)
  const { fontSize, defaultXlsmName, openSettings } = useContext(SettingsContext)
  const onZoomChange = (amount: number) => setScale(scale => scale + amount)

  const onChangePageNum: React.ChangeEventHandler<HTMLInputElement> = event => {
    const pageNum = parseInt(event.target.value)
    if (pageNum >= 1 && pageNum <= pages) setPage(pageNum - 1)
  }

  return children({
    disabled: !isFileLoaded() || getLoadedPages() <= currentPage,
    scale,
    onZoomChange,
    onRotate: angle => {
      if (modList.length !== 0) {
        const result = window.confirm('Warning: all changes will be lost') // TODO: replace this with a proper modal
        if (result === false) {
          return // cancel rotation
        }
      }
      rotate(fileData!, setFileData, angle, currentPage)
      resetModList()
      resetCounter()
    },
    counter,
    onDownload: () => download(fileData!, modList, fontSize, fileName || 'output.pdf'),
    onExport: () => exportBloons(modList, defaultXlsmName),
    onSettings: openSettings,
    onChangePageNum,
  })
}

export default ToolbarController
