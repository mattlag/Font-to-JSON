/* global __APP_VERSION__, __BUILD_DATE__ */

/**
 * Renders the Info page — project info in card layout.
 */
export function renderInfoTab(container) {
	const version =
		typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev';
	const buildDate = typeof __BUILD_DATE__ !== 'undefined' ? __BUILD_DATE__ : '';

	container.innerHTML = `
		<div class="info-page">
			<div class="info-card info-hero-card">
				<img class="info-logo" src="${new URL('../assets/font-flux-js-logo.svg', import.meta.url).href}" alt="Font Flux JS">
				<p class="info-tagline">Convert fonts to JSON, make edits, then convert them back!</p>
				<p class="info-description">Font Flux JS is a JavaScript library for parsing OpenType/TrueType font binaries into structured JSON, then exporting that JSON back into a valid font binary. Every table is fully parsed into human-readable fields! If you're ambitious, you can also create a font JSON from scratch and turn it into a font.</p>
				<p class="info-version">Version ${version}${buildDate ? ` · Built ${buildDate}` : ''}</p>
			</div>

			<div class="info-links-row">
				<a class="info-card info-link-card" href="docs/" target="_blank" rel="noopener">
					<svg class="info-link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
					<span class="info-link-title">Documentation</span>
					<span class="info-link-desc">Browse the full API reference, table specs, and guides.</span>
				</a>
				<a class="info-card info-link-card" href="https://www.npmjs.com/package/font-flux-js" target="_blank" rel="noopener">
					<svg class="info-link-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M0 0v24h24V0H0zm19.2 19.2h-2.4V7.2h-4.8v12H4.8V4.8h14.4v14.4z"/></svg>
					<span class="info-link-title">NPM</span>
					<span class="info-link-desc">Install the package and check version history.</span>
				</a>
				<a class="info-card info-link-card" href="https://github.com/mattlag/Font-Flux-JS" target="_blank" rel="noopener">
					<svg class="info-link-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
					<span class="info-link-title">GitHub</span>
					<span class="info-link-desc">View the source code, report issues, and contribute.</span>
				</a>
			</div>

			<div class="info-card info-family-card">
				<p>Font Flux JS is a member of the <strong>Glyphr Studio</strong> family. You can raise issues on the <a href="https://github.com/mattlag/Font-Flux-JS/issues" target="_blank" rel="noopener">GitHub page</a>, or reach out to <a href="mailto:mail@glyphrstudio.com">mail@glyphrstudio.com</a> — we always love hearing feedback and answering questions!</p>
			</div>
		</div>
	`;
}
