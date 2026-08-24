import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ command, mode }) => {
	const env = loadEnv(mode, "../../..", "");
	const devServerOrigin = env.KDS_DEV_SERVER_ORIGIN || "http://localhost:5173";
	const backendOrigin = env.VITE_BACKEND_ORIGIN || "http://localhost:8000";

	return {
		envDir: "../../..",
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
			port: new URL(devServerOrigin).port || 5173,
			cors: true,
			origin: devServerOrigin,
			hmr: {
				overlay: false,
			},
			proxy: {
				"^/(berpnext|api|assets|files)": {
					target: backendOrigin,
					changeOrigin: true,
					secure: false,
				},
			},
		},
		css: {
			devSourcemap: true,
		},
	};
});
