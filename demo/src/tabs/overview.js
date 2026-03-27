/**
 * Overview tab — font identity, metrics, and stats.
 * Supports inline editing of identity strings and metric values.
 */
export const overviewTab = {
	id: 'overview',
	label: 'Overview',
	render,
};

// ── Name ID ↔ font property mapping (mirrors src/simplify.js NAME_ID_MAP) ──
const NAME_ID_MAP = {
	copyright: 0,
	familyName: 1,
	styleName: 2,
	uniqueID: 3,
	fullName: 4,
	version: 5,
	postScriptName: 6,
	trademark: 7,
	manufacturer: 8,
	designer: 9,
	description: 10,
	vendorURL: 11,
	designerURL: 12,
	license: 13,
	licenseURL: 14,
	sampleText: 19,
};

// ── Weight / width label maps ───────────────────────────────────────────────
const WEIGHT_LABELS = {
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
const WEIGHT_OPTIONS = Object.entries(WEIGHT_LABELS).map(([v, l]) => ({
	value: Number(v),
	label: `${v} (${l})`,
}));

const WIDTH_LABELS = {
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
const WIDTH_OPTIONS = Object.entries(WIDTH_LABELS).map(([v, l]) => ({
	value: Number(v),
	label: `${v} (${l})`,
}));

// ─────────────────────────────────────────────────────────────────────────────

function render(container, fontData, appContext) {
	const wrap = document.createElement('div');
	wrap.className = 'overview';

	wrap.appendChild(buildStatsSection(fontData));

	const hint = document.createElement('p');
	hint.className = 'overview-edit-hint';
	hint.textContent =
		'Click any identity or metric value below to edit it directly.';
	wrap.appendChild(hint);

	wrap.appendChild(buildIdentitySection(fontData, appContext));
	wrap.appendChild(buildMetricsSection(fontData, appContext));

	container.appendChild(wrap);
}

// ─── Stats ──────────────────────────────────────────────────────────────────

function buildStatsSection(fontData) {
	const section = makeSection('At a Glance');

	const glyphCount = fontData.glyphs?.length ?? 0;
	const tableCount = fontData.tables ? Object.keys(fontData.tables).length : 0;

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

function buildIdentitySection(fontData, appContext) {
	const section = makeSection('Font Identity');
	const font = fontData.font || {};

	const fields = [
		{ label: 'Family Name', key: 'familyName' },
		{ label: 'Style Name', key: 'styleName' },
		{ label: 'Full Name', key: 'fullName' },
		{ label: 'PostScript Name', key: 'postScriptName', mono: true },
		{ label: 'Version', key: 'version' },
		{ label: 'Unique ID', key: 'uniqueID', mono: true },
		{ label: 'Copyright', key: 'copyright' },
		{ label: 'Trademark', key: 'trademark' },
		{ label: 'Designer', key: 'designer' },
		{ label: 'Manufacturer', key: 'manufacturer' },
		{ label: 'Vendor URL', key: 'vendorURL' },
		{ label: 'Designer URL', key: 'designerURL' },
		{ label: 'Description', key: 'description' },
		{ label: 'License', key: 'license' },
		{ label: 'License URL', key: 'licenseURL' },
		{ label: 'Sample Text', key: 'sampleText' },
	];

	section.appendChild(
		buildEditableMetaGrid(fields, font, (key, newValue) => {
			font[key] = newValue;
			updateNameTable(fontData, key, newValue);
			if (appContext) appContext.markDirty();
		}),
	);
	return section;
}

// ─── Metrics ────────────────────────────────────────────────────────────────

function buildMetricsSection(fontData, appContext) {
	const section = makeSection('Metrics');
	const font = fontData.font || {};

	function onMetricChange(key, newValue) {
		font[key] = newValue;
		syncMetricToTables(fontData, key, newValue);
		if (appContext) appContext.markDirty();
	}

	const fields = [
		{ label: 'Units per Em', key: 'unitsPerEm', type: 'number', mono: true },
		{ label: 'Ascender', key: 'ascender', type: 'number', mono: true },
		{ label: 'Descender', key: 'descender', type: 'number', mono: true },
		{ label: 'Line Gap', key: 'lineGap', type: 'number', mono: true },
		{
			label: 'Weight Class',
			key: 'weightClass',
			type: 'enum',
			enumOptions: WEIGHT_OPTIONS,
			mono: true,
		},
		{
			label: 'Width Class',
			key: 'widthClass',
			type: 'enum',
			enumOptions: WIDTH_OPTIONS,
			mono: true,
		},
		{ label: 'Italic Angle', key: 'italicAngle', type: 'number', mono: true },
		{ label: 'Fixed Pitch', key: 'isFixedPitch', type: 'boolean' },
		{
			label: 'Underline Position',
			key: 'underlinePosition',
			type: 'number',
			mono: true,
		},
		{
			label: 'Underline Thickness',
			key: 'underlineThickness',
			type: 'number',
			mono: true,
		},
		{ label: 'Vendor ID', key: 'achVendID', type: 'string', mono: true },
		{ label: 'Created', key: 'created', type: 'string' },
		{ label: 'Modified', key: 'modified', type: 'string' },
	];

	section.appendChild(buildEditableMetaGrid(fields, font, onMetricChange));
	return section;
}

// ─── Editable Meta Grid ─────────────────────────────────────────────────────

function buildEditableMetaGrid(fields, dataObj, onChange) {
	const WIDE_THRESHOLD = 60;
	const grid = document.createElement('div');
	grid.className = 'meta-grid';

	for (const field of fields) {
		const item = document.createElement('div');
		item.className = 'meta-item';

		const rawValue = dataObj[field.key];
		const displayStr = formatDisplayValue(rawValue, field);

		if (displayStr.length > WIDE_THRESHOLD) {
			item.classList.add('meta-item-wide');
		}

		const labelEl = document.createElement('div');
		labelEl.className = 'label';
		labelEl.textContent = field.label;

		const valueEl = document.createElement('div');
		valueEl.className = 'value editable';
		if (field.mono) valueEl.classList.add('mono');

		setDisplayMode(valueEl, rawValue, field);

		valueEl.addEventListener('click', () => {
			if (valueEl.classList.contains('editing')) return;
			enterEditMode(valueEl, dataObj[field.key], field, (newValue) => {
				dataObj[field.key] = newValue;
				valueEl.classList.add('modified');
				setDisplayMode(valueEl, newValue, field);
				onChange(field.key, newValue);
			});
		});

		item.append(labelEl, valueEl);
		grid.appendChild(item);
	}

	return grid;
}

function formatDisplayValue(value, field) {
	if (value === undefined || value === null || value === '') return '';
	if (field.type === 'boolean') return value ? 'Yes' : 'No';
	if (field.type === 'enum' && field.enumOptions) {
		const opt = field.enumOptions.find((o) => o.value === value);
		return opt ? opt.label : String(value);
	}
	if (field.key === 'italicAngle') return `${value}°`;
	return String(value);
}

function setDisplayMode(valueEl, value, field) {
	valueEl.classList.remove('editing');
	const str = formatDisplayValue(value, field);
	if (!str) {
		valueEl.classList.add('empty');
		valueEl.textContent = '—';
	} else {
		valueEl.classList.remove('empty');
		valueEl.textContent = str;
	}
}

function enterEditMode(valueEl, currentValue, field, onCommit) {
	valueEl.classList.add('editing');
	valueEl.classList.remove('empty');
	valueEl.innerHTML = '';

	const type = field.type || 'string';

	if (type === 'boolean') {
		const checkbox = document.createElement('input');
		checkbox.type = 'checkbox';
		checkbox.checked = !!currentValue;
		checkbox.className = 'edit-checkbox';
		valueEl.appendChild(checkbox);
		checkbox.focus();
		checkbox.addEventListener('change', () => {
			onCommit(checkbox.checked);
		});
		checkbox.addEventListener('blur', () => {
			onCommit(checkbox.checked);
		});
		checkbox.addEventListener('keydown', (e) => {
			if (e.key === 'Escape') {
				setDisplayMode(valueEl, currentValue, field);
			}
		});
		return;
	}

	if (type === 'enum' && field.enumOptions) {
		const select = document.createElement('select');
		select.className = 'edit-select';
		for (const opt of field.enumOptions) {
			const option = document.createElement('option');
			option.value = opt.value;
			option.textContent = opt.label;
			if (opt.value === currentValue) option.selected = true;
			select.appendChild(option);
		}
		valueEl.appendChild(select);
		select.focus();
		select.addEventListener('change', () => {
			onCommit(Number(select.value));
		});
		select.addEventListener('blur', () => {
			onCommit(Number(select.value));
		});
		select.addEventListener('keydown', (e) => {
			if (e.key === 'Escape') {
				setDisplayMode(valueEl, currentValue, field);
			}
		});
		return;
	}

	// String or number input
	const input = document.createElement('input');
	input.type = type === 'number' ? 'number' : 'text';
	input.className = 'edit-input';
	if (field.mono) input.classList.add('mono');
	input.value =
		currentValue !== undefined && currentValue !== null
			? String(currentValue)
			: '';
	if (type === 'number') input.step = 'any';

	valueEl.appendChild(input);
	input.focus();
	input.select();

	function commit() {
		const raw = input.value;
		let parsed;
		if (type === 'number') {
			parsed = raw === '' ? undefined : Number(raw);
			if (parsed !== undefined && Number.isNaN(parsed)) {
				setDisplayMode(valueEl, currentValue, field);
				return;
			}
		} else {
			parsed = raw === '' ? undefined : raw;
		}
		onCommit(parsed);
	}

	input.addEventListener('keydown', (e) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			commit();
		} else if (e.key === 'Escape') {
			setDisplayMode(valueEl, currentValue, field);
		}
	});
	input.addEventListener('blur', commit);
}

// ─── Sync Edits to Raw Tables ───────────────────────────────────────────────

function updateNameTable(fontData, fontPropKey, newValue) {
	const nameID = NAME_ID_MAP[fontPropKey];
	if (nameID === undefined) return;
	const nameTable = fontData.tables?.name;
	if (!nameTable?.names) return;

	const str =
		newValue !== undefined && newValue !== null ? String(newValue) : '';

	for (const rec of nameTable.names) {
		if (rec.nameID === nameID) {
			rec.value = str;
		}
	}
}

function syncMetricToTables(fontData, key, value) {
	const tables = fontData.tables;
	if (!tables) return;

	const head = tables.head;
	const hhea = tables.hhea;
	const os2 = tables['OS/2'];
	const post = tables.post;

	switch (key) {
		case 'unitsPerEm':
			if (head) head.unitsPerEm = value;
			break;
		case 'ascender':
			if (hhea) hhea.ascender = value;
			if (os2) os2.sTypoAscender = value;
			break;
		case 'descender':
			if (hhea) hhea.descender = value;
			if (os2) os2.sTypoDescender = value;
			break;
		case 'lineGap':
			if (hhea) hhea.lineGap = value;
			if (os2) os2.sTypoLineGap = value;
			break;
		case 'weightClass':
			if (os2) os2.usWeightClass = value;
			break;
		case 'widthClass':
			if (os2) os2.usWidthClass = value;
			break;
		case 'italicAngle':
			if (post) post.italicAngle = value;
			break;
		case 'isFixedPitch':
			if (post) post.isFixedPitch = value ? 1 : 0;
			break;
		case 'underlinePosition':
			if (post) post.underlinePosition = value;
			break;
		case 'underlineThickness':
			if (post) post.underlineThickness = value;
			break;
		case 'achVendID':
			if (os2) os2.achVendID = value;
			break;
	}
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
