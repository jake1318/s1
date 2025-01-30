import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
    assetsInlineLimit: 0, // Ensures all assets (icons, images) are kept as files
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"), // Ensure index.html is included as entry
      },
      output: {
        assetFileNames: "assets/[name]-[hash][extname]", // Keeps assets properly named
      },
    },
  },
  publicDir: "public", // Ensures public assets like icons are copied
  server: {
    port: 3000,
    host: true,
  },
});
