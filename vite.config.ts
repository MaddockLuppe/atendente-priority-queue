import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: mode === 'development' ? '::' : 'localhost',
    port: 8080,
    strictPort: true,
    // Configurações de segurança para desenvolvimento
    headers: mode === 'development' ? {
      // Allow Lovable preview iframe in development
      'Content-Security-Policy': "frame-ancestors 'self' https://*.lovable.app https://*.lovable.dev https://*.lovableproject.com",
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    } : undefined
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Configurações de build para produção
  build: {
    // Minificar e otimizar para produção
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: mode === 'production'
      }
    },
    // Configurações de segurança
    rollupOptions: {
      output: {
        // Ofuscar nomes de arquivos em produção
        entryFileNames: mode === 'production' ? '[name]-[hash].js' : '[name].js',
        chunkFileNames: mode === 'production' ? '[name]-[hash].js' : '[name].js',
        assetFileNames: mode === 'production' ? '[name]-[hash].[ext]' : '[name].[ext]'
      }
    }
  },
  // Variáveis de ambiente seguras
  define: {
    // Remover informações sensíveis em produção
    __DEV__: mode === 'development'
  }
}));
