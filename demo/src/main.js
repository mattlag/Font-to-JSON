import { initWoff2 } from 'font-flux-js';
import { exportFont } from 'font-flux-js/export';
import { importFont } from 'font-flux-js/import';
import { fontToJSON } from 'font-flux-js/json';
import { validateJSON } from 'font-flux-js/validate';
import { createLoadingScreen } from './components/loading.js';
import { createSaveDialog } from './components/save-dialog.js';
import { createTabBar } from './components/tab-bar.js';
import { renderInfoTab } from './tabs/info.js';
import { overviewTab } from './tabs/overview.js';
import { previewTab } from './tabs/preview.js';
import { subsetTab } from './tabs/subset.js';
import { createTableTab } from './tabs/table-detail.js';

const app = document.getElementById('app');

let fontFaceURL = null;

function showLoadingScreen() {
	// Revoke previous blob URL
	if (fontFaceURL) {
		URL.revokeObjectURL(fontFaceURL);
		fontFaceURL = null;
	}

	app.className = '';
	app.innerHTML = '';
	const screen = createLoadingScreen(app, onFontLoaded);

	async function onFontLoaded(buffer, fileName) {
		try {
			const fontData = importFont(buffer);

			// Inject @font-face from original binary for live preview
			injectFontFace(buffer, fileName);

			// Handle collections: tag every font with shared metadata
			let displayData;
			if (fontData.collection) {
				for (let i = 0; i < fontData.fonts.length; i++) {
					const f = fontData.fonts[i];
					f._collection = fontData.collection;
					f._collectionFonts = fontData.fonts;
					f._collectionIndex = i;
					f._fileName = fileName;
					f._originalBuffer = buffer;
					f._dirty = false;
				}
				displayData = fontData.fonts[0];
			} else {
				displayData = fontData;
				displayData._fileName = fileName;
				displayData._originalBuffer = buffer;
				displayData._dirty = false;
			}

			showApp(displayData);
		} catch (err) {
			console.error('Import error:', err);
			screen.showError(`Failed to parse font: ${err.message}`);
		}
	}
}

function injectFontFace(buffer, fileName) {
	// Remove previous injected style
	const prev = document.getElementById('demo-font-face');
	if (prev) prev.remove();

	// Determine MIME by extension
	const ext = fileName.split('.').pop().toLowerCase();
	const mimeMap = {
		ttf: 'font/ttf',
		otf: 'font/otf',
		woff: 'font/woff',
		ttc: 'font/collection',
		otc: 'font/collection',
	};
	const mime = mimeMap[ext] || 'font/ttf';

	const blob = new Blob([buffer], { type: mime });
	fontFaceURL = URL.createObjectURL(blob);

	const style = document.createElement('style');
	style.id = 'demo-font-face';
	style.textContent = `
		@font-face {
			font-family: 'DemoLoadedFont';
			src: url('${fontFaceURL}');
		}
	`;
	document.head.appendChild(style);
}

function showApp(fontData) {
	app.className = 'app-loaded';
	app.innerHTML = '';

	// ── App context shared with tabs ──

	function markDirty() {
		fontData._dirty = true;
	}

	function invalidateL1Cache(key) {
		if (key) {
			delete l1Cache[key];
		} else {
			for (const k of Object.keys(l1Cache)) delete l1Cache[k];
		}
		// Re-render active tab
		if (activeL1) {
			const prev = activeL1;
			activeL1 = null;
			setL1Active(prev);
		}
	}

	const appContext = { fontData, markDirty, invalidateL1Cache };

	// Header
	const header = document.createElement('header');
	header.className = 'app-header';

	// Left: title + font name
	const headerLeft = document.createElement('div');
	headerLeft.className = 'header-left';

	const title = document.createElement('img');
	title.src = new URL('./assets/font-flux-js-logo.svg', import.meta.url).href;
	title.alt = 'font flux js';
	title.className = 'header-logo';

	const fontName = document.createElement('span');
	fontName.className = 'font-name';
	const displayName =
		fontData.font?.fullName ||
		fontData.font?.familyName ||
		fontData._fileName ||
		'Untitled Font';
	fontName.textContent = displayName;

	headerLeft.append(title, fontName);

	// Collection font chooser
	if (fontData._collectionFonts && fontData._collectionFonts.length > 1) {
		const chooser = document.createElement('select');
		chooser.className = 'font-chooser';
		for (let i = 0; i < fontData._collectionFonts.length; i++) {
			const f = fontData._collectionFonts[i];
			const opt = document.createElement('option');
			opt.value = String(i);
			opt.textContent =
				f.font?.fullName || f.font?.familyName || `Font ${i + 1}`;
			if (i === (fontData._collectionIndex ?? 0)) opt.selected = true;
			chooser.appendChild(opt);
		}
		chooser.addEventListener('change', () => {
			const idx = parseInt(chooser.value, 10);
			showApp(fontData._collectionFonts[idx]);
		});
		headerLeft.appendChild(chooser);
	}

	// Center: L1 nav
	const l1Nav = document.createElement('nav');
	l1Nav.className = 'l1-nav';

	const l1Defs = [
		{ key: 'overview', label: 'Overview' },
		{ key: 'preview', label: 'Preview' },
		{ key: 'subset', label: 'Subset' },
		{ key: 'tables', label: 'Tables' },
		{ key: 'info', label: 'Info' },
	];

	const l1Buttons = {};
	l1Defs.forEach(({ key, label }) => {
		const btn = document.createElement('button');
		btn.className = 'l1-tab';
		btn.textContent = label;
		btn.addEventListener('click', () => setL1Active(key));
		l1Nav.appendChild(btn);
		l1Buttons[key] = btn;
	});

	// Right: Download JSON + Export Font
	const headerRight = document.createElement('div');
	headerRight.className = 'header-right';

	const jsonBtn = document.createElement('button');
	jsonBtn.className = 'header-btn';
	jsonBtn.textContent = 'Download JSON';
	jsonBtn.addEventListener('click', () => {
		const name =
			fontData.font?.familyName ||
			fontData.font?.fullName ||
			fontData._fileName?.replace(/\.[^.]+$/, '') ||
			'font';
		const json = fontToJSON(fontData);
		const blob = new Blob([json], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${name}.json`;
		a.click();
		URL.revokeObjectURL(url);
	});

	const exportBtn = document.createElement('button');
	exportBtn.className = 'header-btn header-btn-primary';
	exportBtn.textContent = 'Export Font';
	exportBtn.addEventListener('click', () => {
		createSaveDialog(app, fontData, { exportFont, validateJSON });
	});

	headerRight.append(jsonBtn, exportBtn);
	header.append(headerLeft, l1Nav, headerRight);
	app.appendChild(header);

	// Content area
	const content = document.createElement('div');
	content.className = 'app-content';
	app.appendChild(content);

	// L1 state
	const l1Cache = {};
	let activeL1 = null;

	function setL1Active(key) {
		if (activeL1 === key) return;
		activeL1 = key;

		Object.entries(l1Buttons).forEach(([k, btn]) => {
			btn.classList.toggle('active', k === key);
		});

		if (!l1Cache[key]) {
			const panel = document.createElement('div');
			panel.className = 'l1-panel';

			if (key === 'overview') {
				panel.classList.add('l1-panel-padded');
				overviewTab.render(panel, fontData, appContext);
			} else if (key === 'preview') {
				panel.classList.add('l1-panel-padded');
				previewTab.render(panel, fontData);
			} else if (key === 'subset') {
				panel.classList.add('l1-panel-padded');
				subsetTab.render(panel, fontData, appContext);
			} else if (key === 'tables') {
				panel.classList.add('l1-panel-tables');
				renderTablesPanel(panel, fontData);
			} else if (key === 'info') {
				panel.classList.add('l1-panel-padded');
				renderInfoTab(panel);
			}

			l1Cache[key] = panel;
		}

		content.innerHTML = '';
		content.appendChild(l1Cache[key]);
	}

	setL1Active('overview');
}

function renderTablesPanel(panel, fontData) {
	if (!fontData.tables) {
		panel.textContent = 'No tables found.';
		return;
	}

	const tags = Object.keys(fontData.tables).sort();
	const tabs = tags.map((tag) => createTableTab(tag, fontData.tables[tag]));
	createTabBar(panel, tabs, fontData);
}

// Boot
initWoff2().then(showLoadingScreen);
