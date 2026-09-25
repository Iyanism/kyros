import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";

// Backend route prefixes — proxied same-origin in dev so auth cookies
// (access_token / refresh_token) are first-party and refresh can work.
const API_TARGET = process.env.VITE_API_PROXY_TARGET ?? "http://localhost:8000";
const API_PREFIXES = [
  "/auth",
  "/users",
  "/clients",
  "/warehouses",
  "/inbound-orders",
  "/outbound-orders",
  "/inventory",
  "/invoices",
  "/payments",
  "/stock-movements",
];

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    proxy: Object.fromEntries(
      API_PREFIXES.map((prefix) => [
        prefix,
        { target: API_TARGET, changeOrigin: true },
      ]),
    ),
  },
});
