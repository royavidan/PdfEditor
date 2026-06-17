import Files, { type FileData, type FilesErrorHandler } from 'react-files'

import type { FileData as PDFFileData } from '../../context/file-context'

import styles from './PdfLoader.module.scss'

interface PdfLoaderProps {
  onLoad(data: PDFFileData, name: string): void
}

function PdfLoader({ onLoad }: PdfLoaderProps) {
  const onFilesChange = async (files: FileData[]) => {
    console.log('got request to load files:', files)
    const file = files[0]
    const data = await file.arrayBuffer()
    onLoad(data, file.name)
  }

  const onFilesError: FilesErrorHandler = (error, files) => {
    console.warn(`error loading files ${files}. error:`, error)
  }
  
  return <div className={styles.dropzone}>
    <Files.default
      className={styles.inner}
      onChange={onFilesChange}
      onError={onFilesError}
      accepts={['.pdf']}
      clickable
      maxFiles={1}
    >
      Drop a file here or click to upload
    </Files.default>
  </div>

}

export default PdfLoader
