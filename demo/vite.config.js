import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
	root: resolve(__dirname),
	build: {
		outDir: resolve(__dirname, 'dist'),
		emptyOutDir: true,
	},
	resolve: {
		alias: {
			'font-flux-js': resolve(__dirname, '../src/main.js'),
		},
	},
	server: {
		port: 5174,
	},
});
