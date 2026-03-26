/**
 * Creates the loading screen with drag-and-drop + file browse.
 * Calls onFontLoaded(arrayBuffer, fileName) when a font is selected.
 */
export function createLoadingScreen(container, onFontLoaded) {
	const ACCEPT = '.otf,.ttf,.woff,.ttc,.otc';

	container.innerHTML = `
		<div class="loading-screen">
			<div class="loading-card">
				<h1>Font Flux JS</h1>
				<p class="tagline">Drop a font file to explore its contents</p>
				<div class="drop-zone" tabindex="0">
					<div class="drop-zone-icon">⬇</div>
					<p class="drop-zone-text"><strong>Drag &amp; drop</strong> a font file here</p>
					<button class="browse-btn" type="button">Browse Files</button>
					<input type="file" accept="${ACCEPT}" hidden>
				</div>
				<p class="supported-formats">Supports OTF, TTF, WOFF, TTC, OTC</p>
				<div class="status-area"></div>
			</div>
		</div>
	`;

	const dropZone = container.querySelector('.drop-zone');
	const fileInput = container.querySelector('input[type="file"]');
	const browseBtn = container.querySelector('.browse-btn');
	const statusArea = container.querySelector('.status-area');

	// Browse button triggers file input
	browseBtn.addEventListener('click', (e) => {
		e.stopPropagation();
		fileInput.click();
	});

	// Clicking the drop zone also opens the file picker
	dropZone.addEventListener('click', () => fileInput.click());

	// Keyboard support
	dropZone.addEventListener('keydown', (e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			fileInput.click();
		}
	});

	// File input change
	fileInput.addEventListener('change', () => {
		if (fileInput.files.length > 0) {
			handleFile(fileInput.files[0]);
		}
	});

	// Drag events
	let dragCounter = 0;

	dropZone.addEventListener('dragenter', (e) => {
		e.preventDefault();
		dragCounter++;
		dropZone.classList.add('dragover');
	});

	dropZone.addEventListener('dragleave', () => {
		dragCounter--;
		if (dragCounter === 0) dropZone.classList.remove('dragover');
	});

	dropZone.addEventListener('dragover', (e) => {
		e.preventDefault();
	});

	dropZone.addEventListener('drop', (e) => {
		e.preventDefault();
		dragCounter = 0;
		dropZone.classList.remove('dragover');
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
