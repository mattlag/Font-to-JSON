/**
 * Overview tab — font identity, metrics, stats, live preview, and table listing.
 */
export const overviewTab = {
	id: 'overview',
	label: 'Overview',
	render,
};

function render(container, fontData) {
	const wrap = document.createElement('div');
	wrap.className = 'overview';

	wrap.appendChild(buildStatsSection(fontData));
	wrap.appendChild(buildIdentitySection(fontData));
	wrap.appendChild(buildMetricsSection(fontData));
	wrap.appendChild(buildPreviewSection(fontData));
	wrap.appendChild(buildGlyphSample(fontData));

	container.appendChild(wrap);
}

// ─── Stats ──────────────────────────────────────────────────────────────────

function buildStatsSection(fontData) {
	const section = makeSection('At a Glance');

	const glyphCount = fontData.glyphs?.length ?? 0;
	const tableCount = fontData.tables ? Object.keys(fontData.tables).length : 0;

	// Detect format
	const hasCFF = fontData.tables?.['CFF '] || fontData.tables?.CFF2;
	const format = hasCFF ? 'CFF (PostScript)' : 'TrueType';

	const axesCount = fontData.axes?.length ?? 0;
	const kerningCount = fontData.kerning?.length ?? 0;

	const stats = [
		{ value: glyphCount.toLocaleString(), label: 'Glyphs' },
		{ value: tableCount, label: 'Tables' },
		{ value: format, label: 'Outline Format' },
		{ value: axesCount > 0 ? `${axesCount} axes` : 'No', label: 'Variable' },
		{
			value: kerningCount > 0 ? kerningCount.toLocaleString() : 'None',
			label: 'Kerning Pairs',
		},
	];

	if (fontData._collection) {
		stats.push({
			value: fontData._collection.numFonts,
			label: 'Fonts in Collection',
		});
	}

	const row = document.createElement('div');
	row.className = 'stats-row';
	for (const s of stats) {
		const card = document.createElement('div');
		card.className = 'stat-card';
		card.innerHTML = `
			<div class="stat-value">${s.value}</div>
			<div class="stat-label">${s.label}</div>
		`;
		row.appendChild(card);
	}
	section.appendChild(row);
	return section;
}

// ─── Identity ───────────────────────────────────────────────────────────────

function buildIdentitySection(fontData) {
	const section = makeSection('Font Identity');
	const font = fontData.font || {};

	const fields = [
		['Family Name', font.familyName],
		['Style Name', font.styleName],
		['Full Name', font.fullName],
		['PostScript Name', font.postScriptName, true],
		['Version', font.version],
		['Unique ID', font.uniqueID, true],
		['Copyright', font.copyright],
		['Trademark', font.trademark],
		['Designer', font.designer],
		['Manufacturer', font.manufacturer],
		['Vendor URL', font.vendorURL],
		['Designer URL', font.designerURL],
		['Description', font.description],
		['License', font.license],
		['License URL', font.licenseURL],
		['Sample Text', font.sampleText],
	];

	section.appendChild(buildMetaGrid(fields));
	return section;
}

// ─── Metrics ────────────────────────────────────────────────────────────────

function buildMetricsSection(fontData) {
	const section = makeSection('Metrics');
	const font = fontData.font || {};

	const weightLabels = {
		100: 'Thin',
		200: 'ExtraLight',
		300: 'Light',
		400: 'Regular',
		500: 'Medium',
		600: 'SemiBold',
		700: 'Bold',
		800: 'ExtraBold',
		900: 'Black',
	};
	const widthLabels = {
		1: 'UltraCondensed',
		2: 'ExtraCondensed',
		3: 'Condensed',
		4: 'SemiCondensed',
		5: 'Normal',
		6: 'SemiExpanded',
		7: 'Expanded',
		8: 'ExtraExpanded',
		9: 'UltraExpanded',
	};

	const wc = font.weightClass;
	const weightStr =
		wc !== undefined
			? `${wc}${weightLabels[wc] ? ' (' + weightLabels[wc] + ')' : ''}`
			: undefined;
	const wid = font.widthClass;
	const widthStr =
		wid !== undefined
			? `${wid}${widthLabels[wid] ? ' (' + widthLabels[wid] + ')' : ''}`
			: undefined;

	const fields = [
		['Units per Em', font.unitsPerEm, true],
		['Ascender', font.ascender, true],
		['Descender', font.descender, true],
		['Line Gap', font.lineGap, true],
		['Weight Class', weightStr, true],
		['Width Class', widthStr, true],
		[
			'Italic Angle',
			font.italicAngle !== undefined ? `${font.italicAngle}°` : undefined,
			true,
		],
		[
			'Fixed Pitch',
			font.isFixedPitch !== undefined
				? font.isFixedPitch
					? 'Yes'
					: 'No'
				: undefined,
		],
		['Underline Position', font.underlinePosition, true],
		['Underline Thickness', font.underlineThickness, true],
		['Vendor ID', font.achVendID, true],
		['Created', font.created],
		['Modified', font.modified],
	];

	section.appendChild(buildMetaGrid(fields));
	return section;
}

// ─── Live Preview ───────────────────────────────────────────────────────────

function buildPreviewSection(fontData) {
	const section = makeSection('Preview');
	const area = document.createElement('div');
	area.className = 'preview-area';

	// Controls
	const controls = document.createElement('div');
	controls.className = 'preview-controls';

	const label = document.createElement('label');
	label.textContent = 'Size';

	const slider = document.createElement('input');
	slider.type = 'range';
	slider.min = '12';
	slider.max = '120';
	slider.value = '48';

	const sizeDisplay = document.createElement('span');
	sizeDisplay.className = 'size-display';
	sizeDisplay.textContent = '48px';

	controls.append(label, slider, sizeDisplay);

	// Editable preview text
	const input = document.createElement('input');
	input.className = 'preview-text-input';
	input.type = 'text';
	input.value =
		fontData.font?.sampleText || 'The quick brown fox jumps over the lazy dog';
	input.placeholder = 'Type preview text…';

	// Preview output
	const preview = document.createElement('div');
	preview.className = 'preview-text';
	preview.style.fontFamily = "'DemoLoadedFont', sans-serif";
	preview.textContent = input.value;

	slider.addEventListener('input', () => {
		const size = slider.value;
		sizeDisplay.textContent = `${size}px`;
		preview.style.fontSize = `${size}px`;
	});

	input.addEventListener('input', () => {
		preview.textContent = input.value;
	});

	area.append(controls, input, preview);
	section.appendChild(area);
	return section;
}

// ─── Glyph Outlines Grid ───────────────────────────────────────────────────

function buildGlyphSample(fontData) {
	const glyphs = fontData.glyphs || [];
	const upm = fontData.font?.unitsPerEm || 1000;
	const ascender = fontData.font?.ascender || upm * 0.8;

	// Collect up to 1000 glyphs that have contours
	const drawn = [];
	for (const glyph of glyphs) {
		if (drawn.length >= 1000) break;
		if (!glyph.contours || glyph.contours.length === 0) continue;
		drawn.push(glyph);
	}

	const section = makeSection(
		`Glyph Outlines (${drawn.length} of ${glyphs.length})`,
	);

	if (drawn.length === 0) {
		const msg = document.createElement('p');
		msg.style.cssText =
			'padding: 16px 20px; color: var(--text-tertiary); font-size: 0.85rem;';
		msg.textContent =
			'No TrueType contour data available (CFF fonts use charString data).';
		section.appendChild(msg);
		return section;
	}

	const grid = document.createElement('div');
	grid.className = 'glyph-grid';

	for (const glyph of drawn) {
		const cell = document.createElement('div');
		cell.className = 'glyph-cell';

		const canvas = document.createElement('canvas');
		canvas.className = 'glyph-thumb';
		canvas.width = 128;
		canvas.height = 128;

		drawGlyph(canvas, glyph, upm, ascender);

		const label = document.createElement('div');
		label.className = 'glyph-label';
		const name = glyph.name || '';
		const uni = glyph.unicode
			? `U+${glyph.unicode.toString(16).toUpperCase().padStart(4, '0')}`
			: '';
		label.textContent = name || uni || '—';
		label.title = [name, uni].filter(Boolean).join(' · ');

		cell.append(canvas, label);
		grid.appendChild(cell);
	}

	section.appendChild(grid);
	return section;
}

/**
 * Draw a single glyph's TrueType contours onto a canvas.
 */
function drawGlyph(canvas, glyph, upm, ascender) {
	const ctx = canvas.getContext('2d');
	const size = canvas.width;
	const padding = 8;
	const drawSize = size - padding * 2;
	const scale = drawSize / upm;

	ctx.clearRect(0, 0, size, size);

	ctx.save();
	// Move origin: x starts at padding, y flipped with ascender at top
	ctx.translate(padding, padding + ascender * scale);
	ctx.scale(scale, -scale);

	ctx.beginPath();
	for (const contour of glyph.contours) {
		if (contour.length === 0) continue;

		let i = 0;
		// Find first on-curve point
		const first = contour[0];
		ctx.moveTo(first.x, first.y);
		i = 1;

		while (i < contour.length) {
			const pt = contour[i];
			if (pt.onCurve) {
				ctx.lineTo(pt.x, pt.y);
				i++;
			} else {
				// Quadratic off-curve: need next point
				const next = contour[(i + 1) % contour.length];
				if (next.onCurve) {
					ctx.quadraticCurveTo(pt.x, pt.y, next.x, next.y);
					i += 2;
				} else {
					// Implied on-curve midpoint
					const midX = (pt.x + next.x) / 2;
					const midY = (pt.y + next.y) / 2;
					ctx.quadraticCurveTo(pt.x, pt.y, midX, midY);
					i++;
				}
			}
		}
		ctx.closePath();
	}

	ctx.fillStyle = '#1a1a1a';
	ctx.fill('evenodd');
	ctx.restore();
}

// ─── Tables Listing ─────────────────────────────────────────────────────────

function buildTablesSection(fontData) {
	const section = makeSection('Tables');
	const grid = document.createElement('div');
	grid.className = 'table-grid';

	const tables = fontData.tables || {};
	const tags = Object.keys(tables).sort();

	for (const tag of tags) {
		const table = tables[tag];
		const el = document.createElement('button');
		el.className = 'table-tag table-tag-clickable';
		el.type = 'button';

		// Estimate size
		let sizeStr = '';
		if (table && table._raw) {
			sizeStr = formatBytes(table._raw.length || table._raw.byteLength || 0);
		} else if (table && table._checksum !== undefined) {
			sizeStr = 'parsed';
		}

		el.innerHTML = `
			<span class="tag-name">${escapeHTML(tag.trim())}</span>
			${sizeStr ? `<span class="tag-size">${sizeStr}</span>` : ''}
		`;

		el.addEventListener('click', () => {
			el.dispatchEvent(
				new CustomEvent('open-table', {
					bubbles: true,
					detail: { tag, tableData: table },
				}),
			);
		});

		grid.appendChild(el);
	}

	section.appendChild(grid);
	return section;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeSection(title) {
	const section = document.createElement('section');
	section.className = 'overview-section';
	const h2 = document.createElement('h2');
	h2.textContent = title;
	section.appendChild(h2);
	return section;
}

function buildMetaGrid(fields) {
	const grid = document.createElement('div');
	grid.className = 'meta-grid';

	for (const [label, value, mono] of fields) {
		const item = document.createElement('div');
		item.className = 'meta-item';

		const labelEl = document.createElement('div');
		labelEl.className = 'label';
		labelEl.textContent = label;

		const valueEl = document.createElement('div');
		valueEl.className = 'value';
		if (mono) valueEl.classList.add('mono');

		if (value === undefined || value === null || value === '') {
			valueEl.classList.add('empty');
			valueEl.textContent = '—';
		} else {
			valueEl.textContent = String(value);
		}

		item.append(labelEl, valueEl);
		grid.appendChild(item);
	}

	return grid;
}

function formatBytes(bytes) {
	if (bytes === 0) return '0 B';
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function escapeHTML(str) {
	const div = document.createElement('div');
	div.textContent = str;
	return div.innerHTML;
}
