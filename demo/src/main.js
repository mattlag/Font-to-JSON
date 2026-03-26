import { importFont } from 'font-flux-js';
import { createLoadingScreen } from './components/loading.js';
import { createTabBar } from './components/tab-bar.js';
import { renderInfoTab } from './tabs/info.js';
import { overviewTab } from './tabs/overview.js';
import { previewTab } from './tabs/preview.js';
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

			// Handle collections: use first font but note it's a collection
			let displayData;
			if (fontData.collection) {
				displayData = fontData.fonts[0];
				displayData._collection = fontData.collection;
				displayData._collectionFonts = fontData.fonts;
			} else {
				displayData = fontData;
			}
			displayData._fileName = fileName;

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

	// Header
	const header = document.createElement('header');
	header.className = 'app-header';

	// Left: title + font name
	const headerLeft = document.createElement('div');
	headerLeft.className = 'header-left';

	const title = document.createElement('h1');
	title.textContent = 'font flux js';

	const fontName = document.createElement('span');
	fontName.className = 'font-name';
	const displayName =
		fontData.font?.fullName ||
		fontData.font?.familyName ||
		fontData._fileName ||
		'Untitled Font';
	fontName.textContent = displayName;
	if (fontData._collection) {
		fontName.textContent += ` (Collection · ${fontData._collection.numFonts} fonts)`;
	}

	headerLeft.append(title, fontName);

	// Center: L1 nav
	const l1Nav = document.createElement('nav');
	l1Nav.className = 'l1-nav';

	const l1Defs = [
		{ key: 'overview', label: 'Overview' },
		{ key: 'preview', label: 'Preview' },
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

	// Right: Load Another
	const loadBtn = document.createElement('button');
	loadBtn.className = 'load-another';
	loadBtn.textContent = 'Load Another';
	loadBtn.addEventListener('click', showLoadingScreen);

	header.append(headerLeft, l1Nav, loadBtn);
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
				overviewTab.render(panel, fontData);
			} else if (key === 'preview') {
				panel.classList.add('l1-panel-padded');
				previewTab.render(panel, fontData);
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
showLoadingScreen();
