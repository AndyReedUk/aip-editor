import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' makes all asset paths relative, so the same build works when served from a GitHub
// Pages sub-path (/aip-editor/), a custom domain root, or the .NET/Docker container - unchanged.
export default defineConfig({
	plugins: [react()],
	base: './',
	server: {
		port: 5173
	}
});
