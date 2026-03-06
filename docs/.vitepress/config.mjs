import { defineConfig } from 'vitepress';

export default defineConfig({
	title: 'Font Flux JS Docs',
	description: 'Reference docs for authoring valid Font Flux JS JSON.',
	ignoreDeadLinks: true,
	themeConfig: {
		nav: [
			{ text: 'Home', link: '/' },
			{ text: 'Validation', link: '/guide/validation' },
			{ text: 'Tables', link: '/tables/' },
		],
		sidebar: [
			{
				text: 'Guide',
				items: [
					{ text: 'Overview', link: '/' },
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
