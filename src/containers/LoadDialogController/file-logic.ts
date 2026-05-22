
import { arrayIsEqual } from '../../utils'
import { type Modification, isModification } from '../../context/modification-context'
import type { FileData } from '../../context/file-context'

const EOF = [...'%%EOF'].map(c => c.charCodeAt(0))

export const tryLoadMods = (data: FileData): { data: FileData, modList: Modification[] | null } => {
    const arrData = new Uint8Array(data)
    let eofIndex = arrData.length - EOF.length
    while (!arrayIsEqual(arrData.slice(eofIndex, eofIndex + EOF.length), EOF)) eofIndex--
    eofIndex += EOF.length
    if (eofIndex < arrData.length) {
        try {
            const modList = JSON.parse(atob(String.fromCharCode(...arrData.slice(eofIndex))))
            if (!Array.isArray(modList) || !modList.every(isModification)) return { data, modList: null }
            return { data: arrData.slice(0, eofIndex).buffer, modList }
        } catch { /* empty */ }
    }
    return { data, modList: null }
}

export const compactMods = (data: FileData, modList: Modification[]) => new Blob([data, btoa(JSON.stringify(modList))], { type: 'application/pdf' })