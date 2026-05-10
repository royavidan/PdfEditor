import React from 'react'
import ReactDOM from 'react-dom'
import App from './App'
require('worker-loader')

it('renders without crashing', () => {
  const div = document.createElement('div')
  ReactDOM.render(<App />, div)
  expect(div.getElementsByClassName('debug')).toHaveLength(0)
  expect((global as any).debugEnabled).toBeFalsy()
  ReactDOM.unmountComponentAtNode(div)
})