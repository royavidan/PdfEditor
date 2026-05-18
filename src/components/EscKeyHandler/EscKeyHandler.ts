import { Component } from 'react'

interface EscKeyHandlerProps {
  onClick(): void
}

class EscKeyHandler extends Component<EscKeyHandlerProps> {
  componentDidMount() {
    document.addEventListener('keyup', this.onKeyup, false)
  }

  componentWillUnmount() {
    document.removeEventListener('keyup', this.onKeyup, false)
  }

  onKeyup = (event: KeyboardEvent) => {
    if (['Escape', 'Esc'].includes(event.key)) {
      this.props.onClick()
    }
  }

  render() {
    return null
  }
}

export default EscKeyHandler
