import { defineConfig } from 'vitepress';

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
			{ text: 'Validation', link: '/guide/validation' },
			{ text: 'Tables', link: '/tables/' },
		],
		sidebar: [
			{
				text: 'Guide',
				items: [
					{ text: 'Overview', link: '/' },
					{ text: 'Creating Fonts', link: '/creating-fonts' },
					{ text: 'Creating an OTF', link: '/creating-otf' },
					{ text: 'Creating a TTF', link: '/creating-ttf' },
					{ text: 'Creating a TTC / OTC', link: '/creating-ttc-otc' },
					{ text: 'Validation', link: '/guide/validation' },
				],
			},
			{
				text: 'Table References',
				items: [{ text: 'All Tables', link: '/tables/' }],
			},
		],
	},
});
