/**
 * Renders the Info page — static links and project info.
 */
export function renderInfoTab(container) {
	container.innerHTML = `
		<div class="info-page">
			<h2>font flux js</h2>
			<p>An open source library for lossless conversion between binary font files and JSON.</p>
			<div class="info-links">
				<a href="docs/" target="_blank" rel="noopener">Documentation</a>
				<a href="https://www.npmjs.com/package/font-flux-js" target="_blank" rel="noopener">NPM</a>
				<a href="https://github.com/mattlag/Font-Flux-JS" target="_blank" rel="noopener">GitHub</a>
			</div>
		</div>
	`;
}
