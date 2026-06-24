import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base must match the GitHub Pages project path: https://isaac-kps.github.io/QA-report/
export default defineConfig({
  base: '/QA-report/',
  plugins: [react()],
})
