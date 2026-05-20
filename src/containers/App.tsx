import React from 'react'
import './App.scss'

import FileProvider from '../context/file-context'
import PdfEditor from '../components/PdfEditor/PdfEditor'

function App() {
  return (
    <div className="App">
      <FileProvider>
        <PdfEditor />
      </FileProvider>
    </div>
  )
}

export default App
