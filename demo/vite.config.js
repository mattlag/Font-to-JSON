import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
	root: resolve(__dirname),
	resolve: {
		alias: {
			'font-flux-js': resolve(__dirname, '../src/main.js'),
		},
	},
	server: {
		port: 5174,
	},
});
