/**
 * Subset tab — select Unicode blocks to remove from the font.
 * No blocks are checked by default; check the ranges you want to remove.
 */
import { UNICODE_BLOCKS } from '../unicode-blocks.js';

export const subsetTab = {
	id: 'subset',
	label: 'Subset',
	render,
};

const PREVIEW_PAGE_SIZE = 1000;

function render(container, fontData, appContext) {
	const wrap = document.createElement('div');
	wrap.className = 'subset-tab';

	const coveredCodes = new Set();
	if (fontData.glyphs) {
		for (const g of fontData.glyphs) {
			if (g.unicode !== undefined && g.unicode !== null) {
				coveredCodes.add(g.unicode);
			}
		}
	}

	// Nothing checked by default
	const blockData = UNICODE_BLOCKS.map((block) => {
		let count = 0;
		for (let cp = block.start; cp <= block.end; cp++) {
			if (coveredCodes.has(cp)) count++;
		}
		return { ...block, count, checked: false };
	}).filter((b) => b.count > 0);

	// ── Apply bar (summary + remove button) — shown first ──
	const applyBar = document.createElement('div');
	applyBar.className = 'subset-apply-bar';

	const summaryEl = document.createElement('div');
	summaryEl.className = 'subset-summary';

	const applyBtn = document.createElement('button');
	applyBtn.className = 'subset-apply-btn';
	applyBtn.textContent = 'Remove Checked Ranges';
	applyBtn.disabled = true;
	applyBtn.addEventListener('click', () => {
		applySubset(fontData, blockData, appContext);
	});

	applyBar.append(summaryEl, applyBtn);
	wrap.appendChild(applyBar);

	// ── Toolbar (filter + toggle) — below summary ──
	const toolbar = document.createElement('div');
	toolbar.className = 'subset-toolbar';

	const searchInput = document.createElement('input');
	searchInput.type = 'text';
	searchInput.placeholder = 'Filter blocks…';
	searchInput.addEventListener('input', () => {
		const q = searchInput.value.toLowerCase();
		for (const row of blockRows) {
			const name = row.dataset.name.toLowerCase();
			row.style.display = name.includes(q) ? '' : 'none';
		}
	});

	const toggleBtn = document.createElement('button');
	toggleBtn.className = 'subset-toggle-btn';
	toggleBtn.innerHTML =
		'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
		'<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>' +
		'<polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>' +
		'</svg> Toggle Selection';
	toggleBtn.addEventListener('click', () => {
		for (const b of blockData) b.checked = !b.checked;
		for (const row of blockRows) {
			const cb = row.querySelector('input');
			cb.checked = !cb.checked;
			row.classList.toggle('checked', cb.checked);
		}
		updateSummary();
	});

	toolbar.append(searchInput, toggleBtn);
	wrap.appendChild(toolbar);

	// ── Block list ──
	const list = document.createElement('div');
	list.className = 'subset-block-list';

	const blockRows = [];
	for (let bi = 0; bi < blockData.length; bi++) {
		const b = blockData[bi];
		const row = document.createElement('label');
		row.className = 'subset-block';
		row.dataset.name = b.name;

		const cb = document.createElement('input');
		cb.type = 'checkbox';
		cb.checked = false;
		cb.addEventListener('change', () => {
			b.checked = cb.checked;
			row.classList.toggle('checked', cb.checked);
			updateSummary();
		});

		const nameEl = document.createElement('span');
		nameEl.className = 'subset-block-name';
		nameEl.textContent = b.name;

		const rangeEl = document.createElement('span');
		rangeEl.className = 'subset-block-range';
		rangeEl.textContent = `U+${hex(b.start)}–${hex(b.end)}`;

		const countBtn = document.createElement('button');
		countBtn.className = 'subset-block-count';
		countBtn.type = 'button';
		countBtn.textContent = `${b.count}`;
		countBtn.title = `Preview ${b.name}`;
		const blockIdx = bi;
		countBtn.addEventListener('click', (e) => {
			e.preventDefault();
			e.stopPropagation();
			previewSelect.value = String(blockIdx);
			previewSelect.dispatchEvent(new Event('change'));
			previewSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
		});

		row.append(cb, nameEl, rangeEl, countBtn);
		list.appendChild(row);
		blockRows.push(row);
	}

	wrap.appendChild(list);

	// ── Range Preview ──
	const previewSection = document.createElement('div');
	previewSection.className = 'subset-preview';

	const previewHeader = document.createElement('div');
	previewHeader.className = 'subset-preview-header';

	const previewLabel = document.createElement('span');
	previewLabel.className = 'subset-preview-label';
	previewLabel.textContent = 'Range Preview';

	const previewSelect = document.createElement('select');
	previewSelect.className = 'subset-preview-select';
	const defaultOpt = document.createElement('option');
	defaultOpt.value = '';
	defaultOpt.textContent = 'Select a range…';
	previewSelect.appendChild(defaultOpt);
	for (let i = 0; i < blockData.length; i++) {
		const opt = document.createElement('option');
		opt.value = String(i);
		opt.textContent = `${blockData[i].name} (${blockData[i].count})`;
		previewSelect.appendChild(opt);
	}

	previewHeader.append(previewLabel, previewSelect);

	const previewBody = document.createElement('div');
	previewBody.className = 'subset-preview-body';

	const previewGrid = document.createElement('div');
	previewGrid.className = 'subset-preview-grid';

	const previewPaging = document.createElement('div');
	previewPaging.className = 'subset-preview-paging';

	previewBody.append(previewGrid, previewPaging);
	previewSection.append(previewHeader, previewBody);
	wrap.appendChild(previewSection);

	let currentPreviewBlock = null;
	let currentPage = 0;

	previewSelect.addEventListener('change', () => {
		const idx = previewSelect.value;
		if (idx === '') {
			currentPreviewBlock = null;
			previewGrid.innerHTML = '';
			previewPaging.innerHTML = '';
			previewBody.classList.remove('has-content');
			return;
		}
		currentPreviewBlock = blockData[parseInt(idx, 10)];
		currentPage = 0;
		renderPreview();
	});

	function renderPreview() {
		if (!currentPreviewBlock) return;
		previewBody.classList.add('has-content');

		const glyphs = [];
		for (
			let cp = currentPreviewBlock.start;
			cp <= currentPreviewBlock.end;
			cp++
		) {
			if (coveredCodes.has(cp)) glyphs.push(cp);
		}

		const totalPages = Math.max(
			1,
			Math.ceil(glyphs.length / PREVIEW_PAGE_SIZE),
		);
		if (currentPage >= totalPages) currentPage = totalPages - 1;
		if (currentPage < 0) currentPage = 0;

		const start = currentPage * PREVIEW_PAGE_SIZE;
		const pageGlyphs = glyphs.slice(start, start + PREVIEW_PAGE_SIZE);

		previewGrid.innerHTML = '';
		for (const cp of pageGlyphs) {
			const cell = document.createElement('div');
			cell.className = 'subset-preview-cell';

			const charEl = document.createElement('span');
			charEl.className = 'subset-preview-char';
			charEl.style.fontFamily = "'DemoLoadedFont', sans-serif";
			charEl.textContent = String.fromCodePoint(cp);

			const codeEl = document.createElement('span');
			codeEl.className = 'subset-preview-code';
			codeEl.textContent = hex(cp);

			cell.append(charEl, codeEl);
			previewGrid.appendChild(cell);
		}

		previewPaging.innerHTML = '';
		if (totalPages > 1) {
			const prevBtn = document.createElement('button');
			prevBtn.className = 'subset-preview-page-btn';
			prevBtn.textContent = '← Prev';
			prevBtn.disabled = currentPage === 0;
			prevBtn.addEventListener('click', () => {
				currentPage--;
				renderPreview();
			});

			const pageInfo = document.createElement('span');
			pageInfo.className = 'subset-preview-page-info';
			pageInfo.textContent = `Page ${currentPage + 1} of ${totalPages}`;

			const nextBtn = document.createElement('button');
			nextBtn.className = 'subset-preview-page-btn';
			nextBtn.textContent = 'Next →';
			nextBtn.disabled = currentPage === totalPages - 1;
			nextBtn.addEventListener('click', () => {
				currentPage++;
				renderPreview();
			});

			previewPaging.append(prevBtn, pageInfo, nextBtn);
		}
	}

	container.appendChild(wrap);

	function updateSummary() {
		const checkedBlocks = blockData.filter((b) => b.checked);
		const removeCount = checkedBlocks.reduce((sum, b) => sum + b.count, 0);
		const total = fontData.glyphs?.length ?? 0;
		const remaining = total - removeCount;

		summaryEl.innerHTML =
			checkedBlocks.length === 0
				? `All <strong>${total}</strong> glyphs included`
				: `<strong>${removeCount}</strong> glyphs to remove · <strong>${remaining}</strong> will remain`;

		applyBtn.disabled = checkedBlocks.length === 0;
	}

	updateSummary();
}

function applySubset(fontData, blockData, appContext) {
	const checked = blockData.filter((b) => b.checked);
	if (checked.length === 0) return;

	const removeCodes = new Set();
	for (const b of checked) {
		for (let cp = b.start; cp <= b.end; cp++) {
			removeCodes.add(cp);
		}
	}

	let removeCount = 0;
	if (fontData.glyphs) {
		for (const g of fontData.glyphs) {
			if (g.unicode !== undefined && removeCodes.has(g.unicode)) {
				removeCount++;
			}
		}
	}

	if (removeCount === 0) return;

	const ok = confirm(
		`Remove ${removeCount} glyph${removeCount > 1 ? 's' : ''} from ${checked.length} checked range${checked.length > 1 ? 's' : ''}?\n\nThis modifies the font data in memory.`,
	);
	if (!ok) return;

	fontData.glyphs = fontData.glyphs.filter(
		(g) => g.unicode === undefined || !removeCodes.has(g.unicode),
	);

	if (fontData.tables?.cmap?.subtables) {
		for (const subtable of fontData.tables.cmap.subtables) {
			if (subtable.glyphIndexMap) {
				for (const cp of removeCodes) {
					delete subtable.glyphIndexMap[cp];
				}
			}
		}
	}

	if (appContext) {
		appContext.markDirty();
		appContext.invalidateL1Cache('subset');
		appContext.invalidateL1Cache('overview');
	}
}

function hex(cp) {
	return cp.toString(16).toUpperCase().padStart(4, '0');
}
