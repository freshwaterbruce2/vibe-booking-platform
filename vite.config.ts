import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [
    react({
      // Enable React Fast Refresh optimization
      fastRefresh: true,
      // Babel optimizations for production
      babel: {
        plugins: process.env.NODE_ENV === 'production' ? [
          ['@babel/plugin-transform-react-constant-elements'],
          ['@babel/plugin-transform-react-inline-elements']
        ] : []
      }
    })
  ],
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
    sourcemap: false, // Disable sourcemaps in production for smaller bundles
    minify: 'terser', // Use Terser for better compression
    target: 'es2020', // Modern JS target for better performance
    cssCodeSplit: true, // Split CSS for better caching
    chunkSizeWarningLimit: 1000, // Warn for chunks > 1MB
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
        dead_code: true,
        unused: true
      },
      mangle: {
        safari10: true
      },
      format: {
        comments: false // Remove comments
      }
    },
    rollupOptions: {
      output: {
        // Optimized chunk splitting for better caching
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            if (id.includes('framer-motion')) {
              return 'animation';
            }
            if (id.includes('@tanstack/react-query') || id.includes('axios')) {
              return 'data-fetching';
            }
            if (id.includes('lucide-react')) {
              return 'icons';
            }
            if (id.includes('zod') || id.includes('react-hook-form')) {
              return 'forms-validation';
            }
            return 'vendor';
          }

          // Feature-based chunks
          if (id.includes('src/components/payment') || id.includes('src/pages/PaymentPage')) {
            return 'payment';
          }
          if (id.includes('src/components/booking') || id.includes('src/pages/BookingPage')) {
            return 'booking';
          }
          if (id.includes('src/components/search') || id.includes('src/pages/SearchResultsPage')) {
            return 'search';
          }
        },
        // Optimize asset names for better caching
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/woff2?|eot|ttf|otf/i.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js'
      },
      // External dependencies for CDN loading (optional)
      external: process.env.NODE_ENV === 'production' ? [] : []
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'framer-motion',
      'lucide-react',
      'clsx',
      'tailwind-merge'
    ],
    exclude: ['@vite/client', '@vite/env']
  },
  // Performance optimizations
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
    treeShaking: true,
    minifyIdentifiers: true,
    minifySyntax: true,
    minifyWhitespace: true
  },
  // CSS optimizations
  css: {
    devSourcemap: false
  }
})