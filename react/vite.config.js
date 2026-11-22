import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { devQRPlugin} from "react-dev-qr";

// https://vite.dev/config/
export default defineConfig({
  build: {
    outDir: "build"
  },
  // One setting for subpath deploys (e.g. BASE_PATH=/tudengibaar/); router + API prefix follow it
  base: process.env.BASE_PATH ?? "/",
  server: {
    proxy: { "/api": "http://localhost:8787" },
  },
  plugins: [react(), tailwindcss(), devQRPlugin()],
})
