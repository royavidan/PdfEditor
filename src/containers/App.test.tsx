import React from 'react'
import ReactDOM from 'react-dom'
import App from './App'

describe('rendering', () => {
  let div: HTMLDivElement

  beforeAll(() => div = document.createElement('div'))
  afterAll(() => ReactDOM.unmountComponentAtNode(div))

  it('renders without crashing', () => {
    ReactDOM.render(<App />, div)
  })

  it('no debug', () => {
    expect(div.getElementsByClassName('debug')).toHaveLength(0)
    expect((global as any).debugEnabled).toBeFalsy()
  })
})