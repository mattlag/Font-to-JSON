/* global __APP_VERSION__, __BUILD_DATE__ */

/**
 * Renders the Info page — static links and project info.
 */
export function renderInfoTab(container) {
	const version =
		typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev';
	const buildDate = typeof __BUILD_DATE__ !== 'undefined' ? __BUILD_DATE__ : '';

	container.innerHTML = `
		<div class="info-page">
			<h2>font flux js</h2>
			<p>Convert a font file to JSON... and back!
			<br><br>
			Font Flux JS is a JavaScript library for parsing OpenType/TrueType font binaries into structured JSON, then exporting that JSON back into a valid font binary. Every table is fully parsed into human-readable fields! If you're ambitious, you can also create a font JSON from scratch and turn it into a font.
			</p>
			<p class="info-version">Version ${version}${buildDate ? ` · Built ${buildDate}` : ''}</p>
			<div class="info-links">
				<a href="docs/" target="_blank" rel="noopener">Documentation</a>
				<a href="https://www.npmjs.com/package/font-flux-js" target="_blank" rel="noopener">NPM</a>
				<a href="https://github.com/mattlag/Font-Flux-JS" target="_blank" rel="noopener">GitHub</a>
			</div>
		</div>
	`;
}
