import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  server: { port: 5175 },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      // the review build also ships the prop gallery and the cast viewer
      input: process.env.VITE_PROCEDURAL ? { main: 'index.html', gallery: 'gallery.html', characters: 'characters.html' } : undefined,
      output: {
        manualChunks: { three: ['three'] },
      },
    },
  },
})
