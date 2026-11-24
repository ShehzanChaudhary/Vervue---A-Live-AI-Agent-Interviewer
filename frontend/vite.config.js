import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Backend (FastAPI) ka port yahan badal lena
const BACKEND = "http://localhost:8000";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: { "/interviews": BACKEND, "/anam": BACKEND },
  },
});
