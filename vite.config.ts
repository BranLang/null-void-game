import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  server: { port: 5175 },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: { three: ['three'] },
      },
    },
  },
})
