import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  // base: nombre del repositorio para GitHub Pages
  base: '/vue-api-restcountries/'
})
