import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      // 개발 환경에서 API 요청을 백엔드 서버로 프록시
      '/api': {
        target: 'https://j14e107.p.ssafy.io:8443',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
