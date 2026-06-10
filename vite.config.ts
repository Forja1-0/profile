import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { port: 5174 },
  build: {
    outDir: "dist",
    sourcemap: true,
    rollupOptions: {
      // Vendors a chunks propios: el chunk de la app queda chico y recharts
      // (la lib pesada, solo usada en páginas elite) cachea por separado.
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          charts: ["recharts"],
        },
      },
    },
  },
});
