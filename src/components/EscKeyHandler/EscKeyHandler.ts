import { useEffect } from 'react'

interface EscKeyHandlerProps {
  onClick(): void
}

function EscKeyHandler({ onClick }: EscKeyHandlerProps) {
  useEffect(() => {
    const onKeyup = (event: KeyboardEvent) => {
      if (['Escape', 'Esc'].includes(event.key)) {
        onClick()
      }
    }
    document.addEventListener('keyup', onKeyup, false)
    return () => document.removeEventListener('keyup', onKeyup, false)
  }, [onClick])

  return null
}

export default EscKeyHandler
