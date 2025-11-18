import { resolve } from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              // Separate vendor chunks for better caching
              'react-vendor': ['react', 'react-dom', 'react-helmet-async', 'react-hot-toast'],
              'supabase-vendor': ['@supabase/supabase-js'],
              'ui-vendor': ['framer-motion', 'lucide-react']
            }
          }
        },
        // Increase chunk size warning limit since we're optimizing
        chunkSizeWarningLimit: 600
      },
      resolve: {
        alias: {
          '@': resolve(__dirname, './src'),
          '@components': resolve(__dirname, './src/components'),
          '@hooks': resolve(__dirname, './src/hooks'),
          '@services': resolve(__dirname, './src/services'),
          '@utils': resolve(__dirname, './src/utils'),
          '@constants': resolve(__dirname, './src/constants'),
          '@types': resolve(__dirname, './src/types')
        }
      }
    };
});
