/**
 * Vite — base /campanhas/ para embed no painel Tilit.
 */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  base: '/campanhas/',
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  build: { cssCodeSplit: true, target: 'es2022' },
})
