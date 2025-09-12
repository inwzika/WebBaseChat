import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react()],
	server: {
		port: 3000,
		proxy: {
			"/api": {
				target: process.env.VITE_BACKEND_ORIGIN || "http://localhost:3001",
				changeOrigin: true,
			},
			"/socket.io": {
				target: process.env.VITE_BACKEND_ORIGIN || "http://localhost:3001",
				ws: true,
				changeOrigin: true,
			},
		},
	},
});
