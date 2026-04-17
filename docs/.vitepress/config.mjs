import { readFileSync } from 'node:fs';
import { defineConfig } from 'vitepress';

const pkg = JSON.parse(
	readFileSync(new URL('../../package.json', import.meta.url), 'utf-8'),
);

export default defineConfig({
	title: 'Font Flux JS Docs',
	description: 'Reference docs for authoring valid Font Flux JS JSON.',
	appearance: true,
	ignoreDeadLinks: true,
	base: '/fontfluxjs/docs/',
	outDir: '../demo/dist/docs',
	head: [
		[
			'link',
			{
				rel: 'icon',
				type: 'image/svg+xml',
				href: '/fontfluxjs/docs/font-flux-js-favicon.svg',
			},
		],
	],
	themeConfig: {
		siteTitle: false,
		logo: { src: '/font-flux-js-logo.svg', style: 'height: 36px' },
		nav: [
			{ text: 'Home', link: '/' },
			{ text: 'Creating Fonts', link: '/creating-fonts' },
			{ text: 'Validation', link: '/validation' },
			{ text: 'Tables', link: '/tables/' },
		],
		sidebar: [
			{
				text: 'Get Started',
				items: [
					{ text: 'Overview', link: '/' },
					{ text: 'Default Technology', link: '/default-technology' },
					{ text: 'Creating Fonts', link: '/creating-fonts' },
					{ text: 'Validation', link: '/validation' },
				],
			},
			{
				text: 'Font Features',
				items: [
					{ text: 'Creating Glyphs', link: '/creating-glyphs' },
					{ text: 'Creating Kerning', link: '/creating-kerning' },
					{ text: 'Creating Substitutions', link: '/creating-substitutions' },
					{ text: 'Creating Color Fonts', link: '/creating-color-fonts' },
					{ text: 'Creating Variable Fonts', link: '/creating-variables' },
					{
						text: 'Importing Legacy Formats',
						link: '/importing-legacy-formats',
					},
				],
			},
			{
				text: 'Reference',
				items: [
					{ text: 'Creating an OTF', link: '/creating-otf' },
					{ text: 'Creating a TTF', link: '/creating-ttf' },
					{ text: 'All Tables', link: '/tables/' },
				],
			},
		],
	},
	transformPageData(pageData) {
		if (pageData.relativePath === 'index.md') {
			pageData.params = {
				...pageData.params,
				version: pkg.version,
				buildDate: new Date().toLocaleDateString('en-US', {
					year: 'numeric',
					month: 'long',
					day: 'numeric',
				}),
			};
		}
	},
});
