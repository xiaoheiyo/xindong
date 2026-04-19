import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import compression from 'vite-plugin-compression'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    // Gzip 压缩
    compression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 10240, // 只压缩大于 10KB 的文件
      deleteOriginFile: false, // 保留原文件
    }),
    // Brotli 压缩 (更好的压缩率)
    compression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 10240,
      deleteOriginFile: false,
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  build: {
    // 启用 CSS 代码分割
    cssCodeSplit: true,
    // 启用 sourcemap (生产环境可关闭)
    sourcemap: false,
    // 压缩选项
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // 生产环境移除 console
        drop_debugger: true,
      },
    },
    // 资源内联限制 (10KB)
    assetsInlineLimit: 10240,
    // chunk 大小警告限制
    chunkSizeWarningLimit: 1000,
    // rollup 打包选项
    rollupOptions: {
      output: {
        // 静态资源分类打包
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
  },
  server: {
    // 开发服务器 gzip 压缩
    proxy: {},
  },
})
