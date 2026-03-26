/**
 * Preview tab — live text preview and glyph outline grid.
 */
export const previewTab = {
	id: 'preview',
	label: 'Preview',
	render,
};

function render(container, fontData) {
	const wrap = document.createElement('div');
	wrap.className = 'overview';

	wrap.appendChild(buildPreviewSection(fontData));
	wrap.appendChild(buildGlyphSample(fontData, wrap));

	container.appendChild(wrap);
}

// ─── Live Preview ───────────────────────────────────────────────────────────

function buildPreviewSection(fontData) {
	const section = makeSection('Text Preview');
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

function buildGlyphSample(fontData, wrap) {
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
		msg.textContent = 'No outline data available for any glyphs in this font.';
		section.appendChild(msg);
		return section;
	}

	// Detail panel container (shown when a glyph is clicked)
	const detailPanel = document.createElement('div');
	detailPanel.className = 'glyph-detail-panel';
	detailPanel.hidden = true;
	section.appendChild(detailPanel);

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

		cell.addEventListener('click', () => {
			showGlyphDetail(detailPanel, glyph, upm, ascender);
			// Scroll detail into view
			detailPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
		});

		cell.append(canvas, label);
		grid.appendChild(cell);
	}

	section.appendChild(grid);
	return section;
}

// ─── Glyph Detail Panel ─────────────────────────────────────────────────────

function showGlyphDetail(panel, glyph, upm, ascender) {
	panel.hidden = false;
	panel.innerHTML = '';

	// Close button
	const close = document.createElement('button');
	close.className = 'glyph-detail-close';
	close.textContent = '×';
	close.title = 'Close';
	close.addEventListener('click', () => {
		panel.hidden = true;
	});
	panel.appendChild(close);

	// Layout: left (large canvas) + right (data)
	const layout = document.createElement('div');
	layout.className = 'glyph-detail-layout';

	// --- Left: large preview ---
	const canvasWrap = document.createElement('div');
	canvasWrap.className = 'glyph-detail-canvas-wrap';
	const canvas = document.createElement('canvas');
	canvas.width = 256;
	canvas.height = 256;
	drawGlyph(canvas, glyph, upm, ascender);
	canvasWrap.appendChild(canvas);
	layout.appendChild(canvasWrap);

	// --- Right: data ---
	const data = document.createElement('div');
	data.className = 'glyph-detail-data';

	// Identity
	const name = glyph.name || '(unnamed)';
	const uni = glyph.unicode
		? `U+${glyph.unicode.toString(16).toUpperCase().padStart(4, '0')}`
		: null;
	const char = glyph.unicode ? String.fromCodePoint(glyph.unicode) : null;

	const title = document.createElement('h3');
	title.className = 'glyph-detail-title';
	title.textContent = name;
	if (uni) {
		const uniSpan = document.createElement('span');
		uniSpan.className = 'glyph-detail-unicode';
		uniSpan.textContent = ` ${uni}`;
		if (char) uniSpan.textContent += ` "${char}"`;
		title.appendChild(uniSpan);
	}
	data.appendChild(title);

	// Metrics
	const metrics = [];
	if (glyph.advanceWidth != null)
		metrics.push(['Advance Width', glyph.advanceWidth]);
	if (glyph.leftSideBearing != null)
		metrics.push(['Left Side Bearing', glyph.leftSideBearing]);
	if (glyph.advanceHeight != null)
		metrics.push(['Advance Height', glyph.advanceHeight]);
	if (glyph.topSideBearing != null)
		metrics.push(['Top Side Bearing', glyph.topSideBearing]);

	// Outline info
	const isCFF = glyph.contours?.[0]?.[0]?.type;
	const contourCount = glyph.contours?.length || 0;
	let pointCount = 0;
	if (glyph.contours) {
		for (const c of glyph.contours) pointCount += c.length;
	}
	metrics.push(['Contours', contourCount]);
	metrics.push(['Points / Commands', pointCount]);
	metrics.push([
		'Outline Format',
		isCFF ? 'CFF (Cubic Bézier)' : 'TrueType (Quadratic)',
	]);

	if (metrics.length) {
		const grid = document.createElement('div');
		grid.className = 'glyph-detail-metrics';
		for (const [label, value] of metrics) {
			const row = document.createElement('div');
			row.className = 'glyph-detail-metric';
			row.innerHTML = `<span class="gdm-label">${esc(label)}</span><span class="gdm-value">${esc(String(value))}</span>`;
			grid.appendChild(row);
		}
		data.appendChild(grid);
	}

	// CFF Disassembly
	if (glyph.charStringDisassembly) {
		const section = document.createElement('div');
		section.className = 'glyph-detail-section';
		const h4 = document.createElement('h4');
		h4.textContent = 'CharString Disassembly';
		section.appendChild(h4);
		const pre = document.createElement('pre');
		pre.className = 'glyph-detail-code';
		pre.textContent = glyph.charStringDisassembly;
		section.appendChild(pre);
		data.appendChild(section);
	}

	// Contour path data
	if (glyph.contours && glyph.contours.length > 0) {
		const section = document.createElement('div');
		section.className = 'glyph-detail-section';
		const h4 = document.createElement('h4');
		h4.textContent = 'Contour Data';
		section.appendChild(h4);
		const pre = document.createElement('pre');
		pre.className = 'glyph-detail-code';
		pre.textContent = formatContours(glyph.contours);
		section.appendChild(pre);
		data.appendChild(section);
	}

	// Raw charString bytes (collapsed by default)
	if (glyph.charString) {
		const section = document.createElement('div');
		section.className = 'glyph-detail-section';
		const toggle = document.createElement('h4');
		toggle.className = 'glyph-detail-toggle';
		toggle.textContent = '▶ Raw CharString Bytes';
		const pre = document.createElement('pre');
		pre.className = 'glyph-detail-code glyph-detail-collapsed';
		pre.textContent = formatBytes(glyph.charString);
		toggle.addEventListener('click', () => {
			const collapsed = pre.classList.toggle('glyph-detail-collapsed');
			toggle.textContent = (collapsed ? '▶' : '▼') + ' Raw CharString Bytes';
		});
		section.append(toggle, pre);
		data.appendChild(section);
	}

	layout.appendChild(data);
	panel.appendChild(layout);
}

function formatContours(contours) {
	const lines = [];
	for (let i = 0; i < contours.length; i++) {
		lines.push(`Contour ${i}:`);
		for (const pt of contours[i]) {
			if (pt.type) {
				// CFF command format
				switch (pt.type) {
					case 'M':
						lines.push(`  M ${pt.x} ${pt.y}`);
						break;
					case 'L':
						lines.push(`  L ${pt.x} ${pt.y}`);
						break;
					case 'C':
						lines.push(
							`  C ${pt.x1} ${pt.y1}  ${pt.x2} ${pt.y2}  ${pt.x} ${pt.y}`,
						);
						break;
				}
			} else {
				// TrueType point format
				lines.push(`  ${pt.onCurve ? 'on' : 'off'}  ${pt.x} ${pt.y}`);
			}
		}
	}
	return lines.join('\n');
}

function formatBytes(bytes) {
	const rows = [];
	for (let i = 0; i < bytes.length; i += 16) {
		const chunk = bytes.slice(i, i + 16);
		const hex = chunk.map((b) => b.toString(16).padStart(2, '0')).join(' ');
		rows.push(`${i.toString(16).padStart(4, '0')}  ${hex}`);
	}
	return rows.join('\n');
}

function esc(str) {
	const d = document.createElement('div');
	d.textContent = str;
	return d.innerHTML;
}

/**
 * Draw a single glyph's contours onto a canvas.
 * Handles both TrueType contours (points with onCurve) and
 * CFF contours (path commands: M/L/C).
 */
function drawGlyph(canvas, glyph, upm, ascender) {
	const ctx = canvas.getContext('2d');
	const size = canvas.width;
	const padding = 8;
	const drawSize = size - padding * 2;
	const scale = drawSize / upm;

	ctx.clearRect(0, 0, size, size);

	ctx.save();
	ctx.translate(padding, padding + ascender * scale);
	ctx.scale(scale, -scale);

	ctx.beginPath();
	for (const contour of glyph.contours) {
		if (contour.length === 0) continue;

		// Detect format: CFF commands have a `type` property
		if (contour[0].type) {
			// CFF path commands
			for (const cmd of contour) {
				switch (cmd.type) {
					case 'M':
						ctx.moveTo(cmd.x, cmd.y);
						break;
					case 'L':
						ctx.lineTo(cmd.x, cmd.y);
						break;
					case 'C':
						ctx.bezierCurveTo(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
						break;
				}
			}
			ctx.closePath();
		} else {
			// TrueType points with onCurve
			let i = 0;
			const first = contour[0];
			ctx.moveTo(first.x, first.y);
			i = 1;

			while (i < contour.length) {
				const pt = contour[i];
				if (pt.onCurve) {
					ctx.lineTo(pt.x, pt.y);
					i++;
				} else {
					const next = contour[(i + 1) % contour.length];
					if (next.onCurve) {
						ctx.quadraticCurveTo(pt.x, pt.y, next.x, next.y);
						i += 2;
					} else {
						const midX = (pt.x + next.x) / 2;
						const midY = (pt.y + next.y) / 2;
						ctx.quadraticCurveTo(pt.x, pt.y, midX, midY);
						i++;
					}
				}
			}
			ctx.closePath();
		}
	}

	ctx.fillStyle = '#1a1a1a';
	ctx.fill('evenodd');
	ctx.restore();
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
