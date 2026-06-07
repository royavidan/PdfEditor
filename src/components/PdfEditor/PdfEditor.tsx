import React from 'react'

import ViewportStateProvider from '../../context/viewport-context'
import CounterProvider from '../../context/counter-context'
import ToolbarController from '../../containers/ToobarController/ToobarController'
import Toolbar from '../Toolbar/Toolbar'
import LoadDialogController from '../../containers/LoadDialogController/LoadDialogController'
import PdfLoader from '../PdfLoader/PdfLoader'
import PdfViewport from '../PdfRenderer/PdfViewport'
import PdfViewportController from '../../containers/PdfViewportController/PdfViewportController'
import GlobalKeyHandler from '../Handlers/GlobalKeyHandler'
import ModificationProvider from '../../context/modification-context'
import PDFProvider from '../../context/pdf-context'
import PageProvider from '../../context/page-context'

import styles from './PdfEditor.module.scss'

function PdfEditor() {
  return (
    <div className={styles.screenViewport}>
      <ViewportStateProvider>
        <CounterProvider>
          <ModificationProvider>
            <PDFProvider>
              <PageProvider>
                <div className={styles.editorArea}>
                  <LoadDialogController>
                    {loadDialogCtrl => (
                      <React.Fragment>
                        {loadDialogCtrl.isAtReload() ? (
                          <GlobalKeyHandler keys={['Esc', 'Escape']} onClick={loadDialogCtrl.closeDialog} />
                        ) : null}

                        <ToolbarController>
                          {toolbarCtrl => (
                            <Toolbar
                              onLoad={loadDialogCtrl.openDialog}
                              onSave={loadDialogCtrl.onSave}
                              {...toolbarCtrl}
                            />
                          )}
                        </ToolbarController>
                        <div className={styles.pdfViewportArea}>
                          {loadDialogCtrl.showDialog ? (
                            <PdfLoader onLoad={loadDialogCtrl.onLoad} />
                          ) : null}

                          <PdfViewportController>
                            {viewportCtrl => <PdfViewport {...viewportCtrl} onSave={loadDialogCtrl.onSave} />}
                          </PdfViewportController>
                        </div>
                      </React.Fragment>
                    )}
                  </LoadDialogController>
                </div>
              </PageProvider>
            </PDFProvider>
          </ModificationProvider>
        </CounterProvider>
      </ViewportStateProvider>
    </div>
  )
}

export default PdfEditor
