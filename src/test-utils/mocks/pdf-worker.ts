import { extractPDFPageData, WorkerType } from '../../workers/pdf-worker'

const empty = () => {}

class Worker implements WorkerType {
    onmessage: WorkerType['onmessage'] = empty
    postMessage: WorkerType['postMessage'] = (message) => {
        for (const { opList, rotation, pageHeight, textItems } of message) {
            try {
                const data = extractPDFPageData(opList, rotation, pageHeight, textItems)
                this.onmessage(new MessageEvent('message', { data: { success: true, data } }))
            } catch (e) {
                this.onmessage(new MessageEvent('message', { data: { success: false, error: e as Error } }))
            }
        }
    }
    terminate: WorkerType['terminate'] = () => {
        this.onmessage = empty
        this.postMessage = empty
    }
}

export default Worker
