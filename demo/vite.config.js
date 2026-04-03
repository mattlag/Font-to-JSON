import { readFileSync } from 'fs';
import { resolve } from 'path';
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
			'font-flux-js/export': resolve(__dirname, '../src/export.js'),
			'font-flux-js/import': resolve(__dirname, '../src/import.js'),
			'font-flux-js/json': resolve(__dirname, '../src/json.js'),
			'font-flux-js/validate': resolve(__dirname, '../src/validate/index.js'),
			'font-flux-js': resolve(__dirname, '../src/main.js'),
		},
	},
	server: {
		port: 5174,
	},
});
