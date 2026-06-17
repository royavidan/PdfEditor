import './App.scss'

import FileProvider from '../context/file-context'
import SettingsProvider from '../context/settings-context'
import PdfEditor from '../components/PdfEditor/PdfEditor'
import Settings from '../popups/Settings/Settings'

function App() {
  return (
    <div className="App">
      <SettingsProvider>
        <FileProvider>
          <PdfEditor />
          <Settings/>
        </FileProvider>
      </SettingsProvider>
    </div>
  )
}

export default App
