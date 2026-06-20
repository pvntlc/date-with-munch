import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/apple-touch-icon.png', 'icons/favicon.png'],
      manifest: {
        name: '위드먼치',
        short_name: '위드먼치',
        description: '먹고자와의 데이트를 사진·장소·일기로 기록하는 앱',
        lang: 'ko',
        theme_color: '#ffffff',
        background_color: '#fbfbfa',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
        navigateFallback: '/index.html',
        // 프록시 경로는 서비스워커가 가로채지 않도록 (네트워크로 직행)
        navigateFallbackDenylist: [/^\/place-proxy\//],
      },
    }),
  ],
  server: { port: 5173, open: true },
})
