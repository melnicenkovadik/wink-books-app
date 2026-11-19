import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// CodeSandbox serves the preview from <id>-<port>.csb.app, which Vite blocks by default.
const allowedHosts = [
  process.env.CODESANDBOX_HOST?.replace('$PORT', '5173'),
  process.env.VITE_ALLOWED_HOST,
].filter((host): host is string => Boolean(host))

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts,
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Bootstrap 5.3 still uses @import and the old color functions.
        silenceDeprecations: ['import', 'global-builtin', 'color-functions', 'if-function'],
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: false,
    env: { VITE_GOOGLE_BOOKS_API_KEY: 'test-key' },
  },
})
