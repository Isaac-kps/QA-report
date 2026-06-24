import { execSync } from 'node:child_process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// "Last modified" = the author date of the most recent commit that touched the
// report data file. This makes the date track edits to the JSON specifically:
// editing the data updates it; code-only changes do not. Requires full git
// history at build time (the deploy workflow checks out with fetch-depth: 0).
// Author date (%aI) is used because it survives the subtree split on deploy.
const DATA_FILE = 'src/data/quality-report.json'
let lastModified = ''
try {
  lastModified = execSync(`git log -1 --format=%aI -- ${DATA_FILE}`).toString().trim()
  // Fallback for shallow clones where the file's commit isn't in history.
  if (!lastModified) {
    lastModified = execSync('git log -1 --format=%aI').toString().trim()
  }
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
