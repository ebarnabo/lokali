import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

const CSP_NONCE = 'lokali2026'

function cspNonce(): Plugin {
  return {
    name: 'csp-nonce',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        const meta =
          `<meta http-equiv="Content-Security-Policy" content="script-src 'nonce-${CSP_NONCE}' 'strict-dynamic'; base-uri 'self'">`
        const withMeta = html.replace('<head>', `<head>\n    ${meta}`)
        return withMeta.replace(/<script(?![^>]*\bnonce=)/g, `<script nonce="${CSP_NONCE}"`)
      },
    },
  }
}

export default defineConfig({
  plugins: [react(), cspNonce()],
})
