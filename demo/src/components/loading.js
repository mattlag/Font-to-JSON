/**
 * Creates the loading screen with drag-and-drop + file browse.
 * Calls onFontLoaded(arrayBuffer, fileName) when a font is selected.
 */
export function createLoadingScreen(container, onFontLoaded) {
	const ACCEPT = '.otf,.ttf,.woff,.ttc,.otc';

	container.innerHTML = `
		<div class="loading-screen">
			<div class="loading-content">
				<h1>font flux js</h1>
				<p class="hero-tagline">Convert font files to JSON, make edits, then convert it back!</p>
				<p class="hero-links">An open source frontend library. Read the <a href="docs/" target="_blank" rel="noopener">Docs</a>, use it with <a href="https://www.npmjs.com/package/font-flux-js" target="_blank" rel="noopener">NPM</a> or <a href="https://github.com/mattlag/Font-Flux-JS" target="_blank" rel="noopener">GitHub</a></p>
				<p class="tagline">Drop a font file anywhere, or <a href="#" class="browse-link">browse for files</a></p>
				<p class="supported-formats">Supports OTF, TTF, WOFF, TTC, OTC</p>
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
		const valid = ['otf', 'ttf', 'woff', 'ttc', 'otc'];
		if (!valid.includes(ext)) {
			showError(
				`Unsupported file type ".${ext}". Please use OTF, TTF, WOFF, TTC, or OTC.`,
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
	};
}
