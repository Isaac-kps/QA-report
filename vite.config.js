import { execSync } from 'node:child_process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Last commit date of the repo this is built from — on GitHub Actions this is
// the QA-report repo's latest commit, i.e. the GitHub "last modified" date.
let lastModified = ''
try {
  lastModified = execSync('git log -1 --format=%cI').toString().trim()
} catch {
  lastModified = ''
}

// base must match the GitHub Pages project path: https://isaac-kps.github.io/QA-report/
export default defineConfig({
  base: '/QA-report/',
  plugins: [react()],
  define: {
    __LAST_MODIFIED__: JSON.stringify(lastModified),
  },
})
