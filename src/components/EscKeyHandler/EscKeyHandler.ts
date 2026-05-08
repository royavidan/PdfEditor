import { Component } from 'react'
import PropTypes from 'prop-types'

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

  static readonly propTypes = {
    onClick: PropTypes.func.isRequired
  }
}

export default EscKeyHandler
