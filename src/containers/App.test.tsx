/// <reference types="vitest/globals" />
import { createRoot, type Root } from 'react-dom/client'
import App from './App'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const global: any

describe('rendering', () => {
  let div: HTMLDivElement
  let root: Root

  beforeAll(() => div = document.createElement('div'))
  afterAll(() => root.unmount())

  it('renders without crashing', () => {
    root = createRoot(div)
    root.render(<App />)
  })

  it('no debug', () => {
    expect(div.getElementsByClassName('debug')).toHaveLength(0)
    expect(global.debugEnabled).toBeFalsy()
  })
})