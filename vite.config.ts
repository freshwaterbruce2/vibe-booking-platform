import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3009,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React bundle
          vendor: ['react', 'react-dom'],
          
          // Router bundle (separate from vendor for better caching)
          router: ['react-router-dom'],
          
          // UI library bundle
          ui: ['framer-motion', 'lucide-react'],
          
          // Form handling bundle
          forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
          
          // State management bundle
          store: ['zustand'],
          
          // API and networking
          api: ['@tanstack/react-query'],
          
          // Payment processing (separate chunk for security)
          payment: ['@square/web-sdk'],
          
          // Utilities and helpers
          utils: [],
        },
        // Optimize chunk naming for better caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
          const name = facadeModuleId?.replace(/\.(tsx|ts|jsx|js)$/, '') || 'chunk';
          return `assets/${name}-[hash].js`;
        },
        // Optimize asset naming
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || [];
          const extType = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType || '')) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/css/i.test(extType || '')) {
            return `assets/styles/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
      },
    },
    // Performance optimizations
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.debug'],
      },
      mangle: {
        safari10: true,
      },
    },
    // Chunk size warnings
    chunkSizeWarningLimit: 1000,
    reportCompressedSize: true,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
});
