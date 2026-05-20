import { useContext } from 'react'

import { exportBloons, download, rotate } from './toolbar-logic'
import { FileContext } from '../../context/file-context'
import { ViewportContext } from '../../context/viewport-context'
import { CounterContext } from '../../context/counter-context'
import { ModificationContext } from '../../context/modification-context'
import { ControllerProps } from '../../types'
import { PageContext } from '../../context/page-context'
import { PDFContext } from '../../context/pdf-context'

interface ToolbarControllerData {
  disabled: boolean
  scale: number
  onZoomChange(amount: number): void
  onRotate(angle: number): void
  initialCounter: number
  setInitialCounter: React.Dispatch<React.SetStateAction<number>>
  counter: number
  onDownload(): void
  onExport(): void
  onChangePageNum: React.ChangeEventHandler<HTMLInputElement>
  fontSize: number
  setFontSize: React.Dispatch<React.SetStateAction<number>>
}

function ToolbarController({ children }: ControllerProps<ToolbarControllerData>) {
  const { data: fileData, isFileLoaded, setData: setFileData } = useContext(
    FileContext
  )
  const { scale, setScale, fontSize, setFontSize } = useContext(ViewportContext)
  const { initialCounter, setInitialCounter, counter, resetCounter } = useContext(CounterContext)
  const { modList, resetModList } = useContext(ModificationContext)
  const { currentPage, setPage, pages } = useContext(PageContext)
  const { getLoadedPages } = useContext(PDFContext)
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
    initialCounter,
    setInitialCounter,
    counter,
    onDownload: () => download(fileData!, modList, fontSize),
    onExport: () => exportBloons(modList),
    onChangePageNum,
    fontSize,
    setFontSize
  })
}

export default ToolbarController
