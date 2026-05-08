import { Component } from 'react'
import PropTypes from 'prop-types'

import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist'

function loadPage(doc: PDFDocumentProxy, pageNum: number) {
  return doc.getPage(pageNum)
}

interface PdfPageProps {
  document: PDFDocumentProxy
  pageNum: number
  children(pageObj: PDFPageProxy): JSX.Element
}

interface PdfPageState {
  pageObj: PDFPageProxy | null
}

class PdfPage extends Component<PdfPageProps, PdfPageState> {
  constructor(props: PdfPageProps) {
    super(props)
    this.state = {
      pageObj: null
    }
  }

  async componentDidMount() {
    const { document, pageNum } = this.props
    const pageObj = await loadPage(document, pageNum)
    this.setState({
      pageObj
    })
  }

  async componentDidUpdate(prevProps: PdfPageProps, prevState: PdfPageState) {
    const { document, pageNum } = this.props
    // will update state only when one of the props changes
    if (document !== prevProps.document || pageNum !== prevProps.pageNum) {
      const pageObj = await loadPage(document, pageNum)
      this.setState({
        pageObj
      })
    }
  }

  render() {
    const { children } = this.props
    return this.state.pageObj !== null ? children(this.state.pageObj) : null
  }

  static readonly propTypes = {
    document: PropTypes.object.isRequired,
    pageNum: PropTypes.number.isRequired,
    children: PropTypes.func.isRequired
  }
}

export default PdfPage
