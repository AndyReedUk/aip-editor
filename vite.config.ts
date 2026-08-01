import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// viteSingleFile inlines all JS and CSS into a single dist/index.html, so the built file is
// fully self-contained: double-click it to run from disk (file://), or upload it to GitHub Pages
// or any static host. base: './' keeps any remaining paths relative for sub-path hosting.
export default defineConfig({
	plugins: [react(), viteSingleFile()],
	base: './',
	server: {
		port: 5173
	}
});
