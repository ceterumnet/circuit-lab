import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [vue(), vueJsx(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
 test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    root: fileURLToPath(new URL('./', import.meta.url)),
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        '**/*.d.ts',
        '**/*.config.*',
        '**/debug-*.js',
        '**/node_modules/**',
        '**/coverage/**',
        '**/cypress/**',
        '**/__tests__/**',
        'src/views/**',
        'src/**/*.spec.*',
        'src/main.ts',
        'src/App.vue',
        'src/components/HelloWorld.vue',
        'src/components/TheWelcome.vue',
        'src/components/WelcomeItem.vue',
      ],
      thresholds: {
        // Global baseline — accounts for untested services like ac-analysis.ts
        global: {
          statements: 45,
          branches: 75,
          functions: 70,
          lines: 45,
        },
        // Per-file thresholds for critical stores
        'src/stores/circuit.ts': {
          statements: 60,
          branches: 85,
          functions: 60,
          lines: 60,
        },
        'src/stores/interaction.ts': {
          statements: 90,
          branches: 85,
          functions: 85,
          lines: 90,
        },
        'src/stores/history.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
      },
    },
  },
})
