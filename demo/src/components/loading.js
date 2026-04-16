/**
 * Creates the loading screen with drag-and-drop + file browse.
 * Calls onFontLoaded(arrayBuffer, fileName) when a font is selected.
 */
export function createLoadingScreen(container, onFontLoaded) {
	const ACCEPT = '.otf,.ttf,.woff,.woff2,.ttc,.otc';

	container.innerHTML = `
		<div class="loading-screen">
			<div class="loading-content">
				<img class="hero-logo" src="${new URL('../assets/font-flux-js-logo.svg', import.meta.url).href}" alt="font flux js">
				<p class="hero-tagline">Convert fonts to JSON, make edits, then convert them back!</p>
				<p class="hero-links">An open source frontend library. Read the <a href="docs/" target="_blank" rel="noopener">Docs</a>, use it with <a href="https://www.npmjs.com/package/font-flux-js" target="_blank" rel="noopener">NPM</a> or <a href="https://github.com/mattlag/Font-Flux-JS" target="_blank" rel="noopener">GitHub</a></p>
				<p class="hero-demo-hint">This demo app can edit metadata, subset glyphs, and change file formats.</p>
				<div class="beta-notice"><strong>April 2026</strong><br>Actively adding exciting new features!</div>
				<p class="tagline">Drop a font file anywhere, or <a href="#" class="browse-link">browse for files</a></p>
				<p class="supported-formats">Supports OTF, TTF, WOFF, WOFF2, TTC, OTC</p>
				<input type="file" accept="${ACCEPT}" hidden>
				<div class="status-area"></div>
			</div>
		</div>
	`;

	const screen = container.querySelector('.loading-screen');
	const fileInput = container.querySelector('input[type="file"]');
	const browseLink = container.querySelector('.browse-link');
	const statusArea = container.querySelector('.status-area');

	// Browse link triggers file input
	browseLink.addEventListener('click', (e) => {
		e.preventDefault();
		fileInput.click();
	});

	// File input change
	fileInput.addEventListener('change', () => {
		if (fileInput.files.length > 0) {
			handleFile(fileInput.files[0]);
		}
	});

	// Drag events on the whole screen
	let dragCounter = 0;

	screen.addEventListener('dragenter', (e) => {
		e.preventDefault();
		dragCounter++;
		screen.classList.add('dragover');
	});

	screen.addEventListener('dragleave', () => {
		dragCounter--;
		if (dragCounter === 0) screen.classList.remove('dragover');
	});

	screen.addEventListener('dragover', (e) => {
		e.preventDefault();
	});

	screen.addEventListener('drop', (e) => {
		e.preventDefault();
		dragCounter = 0;
		screen.classList.remove('dragover');
		if (e.dataTransfer.files.length > 0) {
			handleFile(e.dataTransfer.files[0]);
		}
	});

	function handleFile(file) {
		// Clear previous errors
		statusArea.innerHTML = '';

		// Validate extension
		const ext = file.name.split('.').pop().toLowerCase();
		const valid = ['otf', 'ttf', 'woff', 'woff2', 'ttc', 'otc'];
		if (!valid.includes(ext)) {
			showError(
				`Unsupported file type ".${ext}". Please use OTF, TTF, WOFF, WOFF2, TTC, or OTC.`,
			);
			return;
		}

		// Show loading state
		showLoading(file.name);

		const reader = new FileReader();
		reader.onload = () => {
			onFontLoaded(reader.result, file.name);
		};
		reader.onerror = () => {
			showError('Failed to read the file. Please try again.');
		};
		reader.readAsArrayBuffer(file);
	}

	function showError(message) {
		statusArea.innerHTML = `<div class="loading-error">${message}</div>`;
	}

	function showDiagnosticReport(fileName, report) {
		const severityIcon = { error: '❌', warning: '⚠️', info: 'ℹ️' };
		const severityClass = {
			error: 'diag-error',
			warning: 'diag-warning',
			info: 'diag-info',
		};

		// Filter: show errors and warnings prominently, infos collapsed
		const errorWarnings = report.issues.filter(
			(i) => i.severity === 'error' || i.severity === 'warning',
		);
		const infos = report.issues.filter((i) => i.severity === 'info');

		let issuesHTML = '';
		for (const issue of errorWarnings) {
			issuesHTML += `<div class="diag-issue ${severityClass[issue.severity]}">${severityIcon[issue.severity]} <code>${issue.code}</code> ${issue.message}</div>`;
		}
		if (infos.length > 0) {
			issuesHTML += `<details class="diag-details"><summary>${infos.length} informational note${infos.length > 1 ? 's' : ''}</summary>`;
			for (const issue of infos) {
				issuesHTML += `<div class="diag-issue ${severityClass[issue.severity]}">${severityIcon[issue.severity]} <code>${issue.code}</code> ${issue.message}</div>`;
			}
			issuesHTML += `</details>`;
		}

		const summaryClass = report.valid ? 'diag-valid' : 'diag-invalid';
		const summaryLabel = report.valid
			? 'No blocking errors'
			: 'Font has problems';

		statusArea.innerHTML = `
			<div class="diagnostic-report">
				<div class="diag-header">
					<span class="diag-title">${report.valid ? '✅' : '🚫'} Diagnostic Report for ${fileName}</span>
					<span class="diag-summary ${summaryClass}">${report.summary.errorCount} error${report.summary.errorCount !== 1 ? 's' : ''}, ${report.summary.warningCount} warning${report.summary.warningCount !== 1 ? 's' : ''}</span>
				</div>
				<div class="diag-issues">${issuesHTML || '<div class="diag-issue diag-info">No issues found.</div>'}</div>
			</div>
		`;
	}

	function showLoading(fileName) {
		statusArea.innerHTML = `
			<div class="loading-spinner">
				<div class="spinner"></div>
				<span>Parsing ${fileName}…</span>
			</div>
		`;
	}

	return {
		showError(message) {
			showError(message);
		},
		showDiagnosticReport(fileName, report) {
			showDiagnosticReport(fileName, report);
		},
	};
}
