  import { defineConfig } from 'vite'
  import react, { reactCompilerPreset } from '@vitejs/plugin-react'
  import babel from '@rolldown/plugin-babel'

  // /api/* → Spring Boot :8080 (máy chạy npm run dev). host: true để mở được bằng IP LAN.
  const apiProxy = {
    '/api': { target: 'http://127.0.0.1:8080', changeOrigin: true },
  }

  export default defineConfig({
    plugins: [
      react(),
      babel({ presets: [reactCompilerPreset()] })
    ],
    server: { host: true, proxy: apiProxy },
    preview: { host: true, proxy: apiProxy },
  })
