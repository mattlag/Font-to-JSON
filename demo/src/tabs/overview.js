/**
 * Overview tab — font identity, metrics, and stats.
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
	const WIDE_THRESHOLD = 60;
	const grid = document.createElement('div');
	grid.className = 'meta-grid';

	for (const [label, value, mono] of fields) {
		const item = document.createElement('div');
		item.className = 'meta-item';

		const str =
			value !== undefined && value !== null && value !== ''
				? String(value)
				: '';
		if (str.length > WIDE_THRESHOLD) {
			item.classList.add('meta-item-wide');
		}

		const labelEl = document.createElement('div');
		labelEl.className = 'label';
		labelEl.textContent = label;

		const valueEl = document.createElement('div');
		valueEl.className = 'value';
		if (mono) valueEl.classList.add('mono');

		if (!str) {
			valueEl.classList.add('empty');
			valueEl.textContent = '—';
		} else {
			valueEl.textContent = str;
		}

		item.append(labelEl, valueEl);
		grid.appendChild(item);
	}

	return grid;
}
