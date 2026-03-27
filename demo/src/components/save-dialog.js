/**
 * Save / Export dialog — modal overlay for downloading the font.
 * Supports format selection (OTF, TTF, WOFF, WOFF2), optional validation,
 * and triggers a browser download.
 */

/**
 * @param {HTMLElement} root - Append overlay to this element
 * @param {object} fontData - The font data object
 * @param {object} apis - { exportFont, validateJSON }
 */
export function createSaveDialog(root, fontData, apis) {
	const { exportFont, validateJSON } = apis;

	// Determine default format from source
	const hasCFF = !!(fontData.tables?.['CFF '] || fontData.tables?.CFF2);
	const woffVersion = fontData._woff?.version;

	const formats = [
		{
			id: 'sfnt-native',
			label: hasCFF ? 'OTF' : 'TTF',
			ext: hasCFF ? '.otf' : '.ttf',
			format: 'sfnt',
		},
		{ id: 'woff', label: 'WOFF', ext: '.woff', format: 'woff' },
		{ id: 'woff2', label: 'WOFF2', ext: '.woff2', format: 'woff2' },
	];

	// Default selection based on source format
	let selectedIdx = woffVersion === 2 ? 2 : woffVersion === 1 ? 1 : 0;

	// Build filename from font data
	const baseName = sanitizeFilename(
		fontData.font?.familyName ||
			fontData.font?.fullName ||
			fontData._fileName?.replace(/\.[^.]+$/, '') ||
			'font',
	);

	// ── Overlay ──
	const overlay = document.createElement('div');
	overlay.className = 'modal-overlay';
	overlay.addEventListener('click', (e) => {
		if (e.target === overlay) close();
	});

	const dialog = document.createElement('div');
	dialog.className = 'save-dialog';

	// Title
	const title = document.createElement('h2');
	title.textContent = 'Export Font';
	dialog.appendChild(title);

	// Filename field
	const fileGroup = document.createElement('div');
	fileGroup.className = 'field-group';
	const fileLabel = document.createElement('div');
	fileLabel.className = 'field-label';
	fileLabel.textContent = 'Filename';
	const fileInput = document.createElement('input');
	fileInput.className = 'field-input';
	fileInput.type = 'text';
	fileInput.value = baseName + formats[selectedIdx].ext;
	fileGroup.append(fileLabel, fileInput);
	dialog.appendChild(fileGroup);

	// Format selection
	const fmtGroup = document.createElement('div');
	fmtGroup.className = 'field-group';
	const fmtLabel = document.createElement('div');
	fmtLabel.className = 'field-label';
	fmtLabel.textContent = 'Format';
	const fmtOptions = document.createElement('div');
	fmtOptions.className = 'format-options';

	const optionEls = [];
	formats.forEach((fmt, i) => {
		const opt = document.createElement('label');
		opt.className = 'format-option' + (i === selectedIdx ? ' selected' : '');

		const radio = document.createElement('input');
		radio.type = 'radio';
		radio.name = 'exportFormat';
		radio.value = fmt.id;
		radio.checked = i === selectedIdx;
		radio.addEventListener('change', () => {
			selectedIdx = i;
			for (const el of optionEls) el.classList.remove('selected');
			opt.classList.add('selected');
			// Update extension in filename
			const current = fileInput.value;
			const withoutExt = current.replace(/\.[^.]+$/, '');
			fileInput.value = withoutExt + fmt.ext;
		});

		const labelText = document.createElement('span');
		labelText.className = 'format-option-label';
		labelText.textContent = fmt.label;

		const extText = document.createElement('span');
		extText.className = 'format-option-ext';
		extText.textContent = fmt.ext;

		opt.append(radio, labelText, extText);
		fmtOptions.appendChild(opt);
		optionEls.push(opt);
	});

	fmtGroup.append(fmtLabel, fmtOptions);
	dialog.appendChild(fmtGroup);

	// Validation results area (hidden initially)
	const valResults = document.createElement('div');
	valResults.className = 'validation-results';
	valResults.style.display = 'none';
	dialog.appendChild(valResults);

	// Actions
	const actions = document.createElement('div');
	actions.className = 'save-dialog-actions';

	const cancelBtn = document.createElement('button');
	cancelBtn.className = 'btn-cancel';
	cancelBtn.textContent = 'Cancel';
	cancelBtn.addEventListener('click', close);

	const validateBtn = document.createElement('button');
	validateBtn.className = 'btn-validate';
	validateBtn.textContent = 'Validate';
	validateBtn.addEventListener('click', () => {
		runValidation();
	});

	const downloadBtn = document.createElement('button');
	downloadBtn.className = 'btn-download';
	downloadBtn.textContent = 'Download';
	downloadBtn.addEventListener('click', () => {
		doExport();
	});

	actions.append(cancelBtn, validateBtn, downloadBtn);
	dialog.appendChild(actions);

	overlay.appendChild(dialog);
	root.appendChild(overlay);

	// Focus filename
	fileInput.focus();
	fileInput.select();

	// Close on Escape
	function onKeyDown(e) {
		if (e.key === 'Escape') close();
	}
	document.addEventListener('keydown', onKeyDown);

	function close() {
		document.removeEventListener('keydown', onKeyDown);
		overlay.remove();
	}

	function runValidation() {
		valResults.style.display = '';
		try {
			const report = validateJSON(fontData);
			if (report.valid && report.warnings.length === 0) {
				valResults.className = 'validation-results valid';
				valResults.textContent = 'Validation passed — no errors or warnings.';
			} else {
				valResults.className = report.valid
					? 'validation-results valid'
					: 'validation-results invalid';

				let html = report.valid
					? '<strong>Valid</strong> with warnings:'
					: `<strong>Invalid</strong> — ${report.summary.errorCount} error(s):`;
				html += '<ul>';
				for (const issue of report.issues) {
					const cls = issue.severity === 'error' ? 'val-error' : 'val-warning';
					html += `<li class="${cls}">[${issue.severity}] ${escapeHtml(issue.message)}</li>`;
				}
				html += '</ul>';
				valResults.innerHTML = html;
			}
		} catch (err) {
			valResults.className = 'validation-results invalid';
			valResults.textContent = `Validation error: ${err.message}`;
		}
	}

	function doExport() {
		const fmt = formats[selectedIdx];
		try {
			const buffer = exportFont(fontData, { format: fmt.format });
			const blob = new Blob([buffer], {
				type: 'application/octet-stream',
			});
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = fileInput.value || baseName + fmt.ext;
			document.body.appendChild(a);
			a.click();
			a.remove();
			URL.revokeObjectURL(url);
			close();
		} catch (err) {
			valResults.style.display = '';
			valResults.className = 'validation-results invalid';
			valResults.textContent = `Export failed: ${err.message}`;
		}
	}
}

function sanitizeFilename(name) {
	return name.replace(/[<>:"/\\|?*]/g, '_').trim() || 'font';
}

function escapeHtml(str) {
	return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
