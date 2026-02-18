import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1", // Força IPv4 (evita problemas com localhost/IPv6)
    port: 5173, // Porta fixa
    strictPort: true, // Se a porta estiver ocupada, quebra (não tenta outra)
  },
});
