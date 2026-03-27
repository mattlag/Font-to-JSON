import { resolve } from 'path';
import { readFileSync } from 'fs';
import { defineConfig } from 'vite';

const pkg = JSON.parse(
	readFileSync(resolve(__dirname, '../package.json'), 'utf-8'),
);

export default defineConfig({
	root: resolve(__dirname),
	base: './',
	build: {
		outDir: resolve(__dirname, 'dist'),
		emptyOutDir: true,
	},
	define: {
		__APP_VERSION__: JSON.stringify(pkg.version),
		__BUILD_DATE__: JSON.stringify(new Date().toISOString().split('T')[0]),
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
