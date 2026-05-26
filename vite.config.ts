/// <reference types="vitest/config" />

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import pkg from './package.json'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react()
  ],
  optimizeDeps: {
    needsInterop: ['react-files']
  },
  define: {
    'import.meta.env.version': JSON.stringify(pkg.version)
  },
  test: {
    environment: 'jsdom',
    // alias: {
    //   'pdfjs-dist': 'pdfjs-dist/legacy/build/pdf.mjs',
    //   'pdfjs-dist/build/pdf.worker.min.mjs': 'pdfjs-dist/legacy/build/pdf.worker.min.mjs'
    // }
  }
})
