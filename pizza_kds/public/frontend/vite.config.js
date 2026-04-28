import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ command }) => ({
	base: command === "build" ? "/assets/pizza_kds/kds/" : "/",
	plugins: [react(), tailwindcss()],
	build: {
		outDir: "../kds",
		emptyOutDir: true,
		manifest: true,
		target: "es6",
		commonjsOptions: {
			transformMixedEsModules: true,
		},
	},
	server: {
		port: 5173,
		cors: true,
		origin: "http://localhost:5173",
		hmr: {
			overlay: false,
		},
		proxy: {
			"^/(berpnext|api|assets|files)": {
				target: "http://localhost:8000", // Your Frappe local port
				changeOrigin: true,
				secure: false,
			},
		},
	},
  css: {
    devSourcemap: true
  }
}));
