import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// codesandbox preview runs on <id>-5173.csb.app, vite blocks unknown hosts
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
        // bootstrap 5.3 is still on @import
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
