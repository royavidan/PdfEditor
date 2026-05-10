import React, { Component } from 'react'
import Files, { FileData, FilesErrorHandler } from 'react-files'
import PropTypes from 'prop-types'

import type { FileData as PDFFileData } from '../../context/file-context'

import styles from './PdfLoader.module.scss'

interface PdfLoaderProps {
  onLoad(data: PDFFileData): void
}

class PdfLoader extends Component<PdfLoaderProps> {
  onFilesChange = async (files: FileData[]) => {
    console.log('got request to load files:', files)
    const file = files[0]
    const data = await file.arrayBuffer()
    console.log('data:', data)
    this.props.onLoad(data)
  }

  onFilesError: FilesErrorHandler = (error, files) => {
    console.warn(`error loading files ${files}. error:`, error)
  }

  render() {
    return (
      <div className={styles.dropzone}>
        <Files
          className={styles.inner}
          onChange={this.onFilesChange}
          onError={this.onFilesError}
          accepts={['.pdf']}
          clickable
          maxFiles={1}
        >
          Drop a file here or click to upload
        </Files>
      </div>
    )
  }

  static readonly propTypes = {
    onLoad: PropTypes.func.isRequired
  }
}

export default PdfLoader
