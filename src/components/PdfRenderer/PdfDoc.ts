import { Component } from 'react'
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.js'
import PropTypes from 'prop-types'

import type { PDFDocumentProxy } from 'pdfjs-dist'
import { FileData } from '../../context/file-context'

function loadDocument(data: FileData) {
  return pdfjs.getDocument(data).promise
}

interface PdfDocProps {
  data: FileData
  children(docObj: PDFDocumentProxy): JSX.Element
}

interface PdfDocState {
  docObj: PDFDocumentProxy | null
  data: FileData
}

class PdfDoc extends Component<PdfDocProps, PdfDocState> {
  constructor(props: PdfDocProps) {
    super(props)
    this.state = {
      docObj: null,
      data: props.data
    }
  }

  async componentDidMount() {
    const docObj = await loadDocument(this.props.data)
    this.setState({
      docObj
    })
  }

  async componentDidUpdate(prevProps: PdfDocProps, prevState: PdfDocState) {
    // will update state only when 'props.data' changes
    if (this.props.data !== prevProps.data) {
      console.log('[PdfDoc] updating doc object')

      const docObj = await loadDocument(this.props.data)
      this.setState({
        docObj,
        data: this.props.data
      })
    }
  }

  render() {
    const { children } = this.props
    return this.state.docObj !== null ? children(this.state.docObj) : null
  }

  static readonly propTypes = {
    data: FileData.isRequired,
    children: PropTypes.func.isRequired
  }
}

export default PdfDoc
