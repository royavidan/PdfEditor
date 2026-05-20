import { useEffect } from 'react'

interface GlobalKeyHandlerProps<T extends string> {
  keys: T[]
  event?: 'keyup' | 'keydown' | 'keypress'
  block?: boolean
  onClick(key: T): void
}

function GlobalKeyHandler<T extends string>({ keys, event, block, onClick }: GlobalKeyHandlerProps<T>) {
  useEffect(() => {
    const onKeyup = (e: KeyboardEvent) => {
      const key = e.key as T
      const match = keys.find(k => {
        let s = k as string
        let match: RegExpMatchArray | null
        while ((match = s.match(/^(ctrl|alt|shift)\+/i))) {
          if (!e[`${match[1].toLowerCase() as 'ctrl' | 'alt' | 'shift'}Key`]) return false
          s = s.slice(match[0].length)
        }
        return s === key
      })
      if (match) {
        if (block) {
          e.stopPropagation()
          e.preventDefault()
        }
        onClick(match)
      }
    }
    const e = event || 'keyup'
    document.addEventListener(e, onKeyup, false)
    return () => document.removeEventListener(e, onKeyup, false)
  }, [onClick, event, keys, block])

  return null
}

export default GlobalKeyHandler
