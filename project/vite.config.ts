// import { defineConfig } from 'vite';
// import react from '@vitejs/plugin-react';

// // https://vitejs.dev/config/
// export default defineConfig({
//   plugins: [react()],
//   optimizeDeps: {
//     exclude: ['lucide-react'],
//   },
// });
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";


export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      util: "util/",
      buffer: "buffer/",
      process: "process/browser"
    }
  },
  define: {
    // prevents some libs from erroring when they reference process.env
    'process.env': {}
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'leaflet': ['leaflet', 'react-leaflet'],
          'mapbox': ['mapbox-gl', 'react-map-gl'],
        }
      }
    }
  }
});
