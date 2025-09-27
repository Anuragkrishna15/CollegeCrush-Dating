import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
          '@components': path.resolve(__dirname, './src/components'),
          '@hooks': path.resolve(__dirname, './src/hooks'),
          '@services': path.resolve(__dirname, './src/services'),
          '@utils': path.resolve(__dirname, './src/utils'),
          '@constants': path.resolve(__dirname, './src/constants'),
          '@types': path.resolve(__dirname, './src/types')
        }
      }
    };
});
