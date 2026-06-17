/// <reference types="vitest/config" />

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react()
  ],
  optimizeDeps: {
    needsInterop: ['react-files']
  },
  define: {
    'import.meta.env.version': JSON.stringify(process.env.NPM_PACKAGE_VERSION)
  },
  test: {
    globals: true,
    testTimeout: 30000,
    environment: 'jsdom',
    alias: {
      'pdfjs-dist': path.resolve(__dirname, 'node_modules/pdfjs-dist/legacy/build/pdf.mjs')
    }
  }
})
