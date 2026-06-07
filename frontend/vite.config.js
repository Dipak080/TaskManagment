import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Production build is served from the /task subfolder on the live domain, so
// assets must be referenced as /task/assets/... . Dev server stays at root (/).
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/task/' : '/',
}))

// Cache bust
