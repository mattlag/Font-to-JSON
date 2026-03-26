import { importFont } from 'font-flux-js';
import { createLoadingScreen } from './components/loading.js';
import { createTabBar } from './components/tab-bar.js';
import { overviewTab } from './tabs/overview.js';
import { createTableTab } from './tabs/table-detail.js';

const app = document.getElementById('app');

let fontFaceURL = null;

function showLoadingScreen() {
	// Revoke previous blob URL
	if (fontFaceURL) {
		URL.revokeObjectURL(fontFaceURL);
		fontFaceURL = null;
	}

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
	app.innerHTML = '';

	// Header
	const header = document.createElement('header');
	header.className = 'app-header';

	const title = document.createElement('h1');
	title.textContent = 'Font Flux JS';

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

	const loadBtn = document.createElement('button');
	loadBtn.className = 'load-another';
	loadBtn.textContent = 'Load Another';
	loadBtn.addEventListener('click', showLoadingScreen);

	header.append(title, fontName, loadBtn);
	app.appendChild(header);

	// Shell
	const shell = document.createElement('div');
	shell.className = 'app-shell';
	app.appendChild(shell);

	// Determine available tabs: Overview + one tab per table
	const tabs = [overviewTab];

	if (fontData.tables) {
		const tags = Object.keys(fontData.tables).sort();
		for (const tag of tags) {
			tabs.push(createTableTab(tag, fontData.tables[tag]));
		}
	}

	const tabBar = createTabBar(shell, tabs, fontData);

	// Listen for table-click events from the overview to navigate
	shell.addEventListener('open-table', (e) => {
		const id = `table:${e.detail.tag.trim()}`;
		tabBar.setActive(id);
	});
}

// Boot
showLoadingScreen();
