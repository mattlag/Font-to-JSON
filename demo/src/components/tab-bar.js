/**
 * Creates a tabbed interface.
 * @param {HTMLElement} container - Parent element
 * @param {Array<{id: string, label: string, render: function}>} tabs - Tab definitions
 * @param {object} fontData - The parsed font data to pass to tab renderers
 */
export function createTabBar(container, tabs, fontData) {
	const bar = document.createElement('nav');
	bar.className = 'tab-bar';

	const content = document.createElement('div');
	content.className = 'tab-content';

	container.append(bar, content);

	const rendered = new Map(); // id → element (lazy render cache)
	let activeId = null;

	tabs.forEach((tab) => addButton(tab));

	function addButton(tab) {
		const btn = document.createElement('button');
		btn.className = 'tab-btn' + (tab.className ? ' ' + tab.className : '');
		btn.textContent = tab.label;
		btn.dataset.tabId = tab.id;
		btn.addEventListener('click', () => setActive(tab.id));
		bar.appendChild(btn);
	}

	function setActive(id) {
		if (activeId === id) return;
		activeId = id;

		// Update button states
		bar.querySelectorAll('.tab-btn').forEach((btn) => {
			btn.classList.toggle('active', btn.dataset.tabId === id);
		});

		// Lazy-render tab content
		if (!rendered.has(id)) {
			const panel = document.createElement('div');
			panel.dataset.tabPanel = id;
			const tab = tabs.find((t) => t.id === id);
			if (tab) tab.render(panel, fontData);
			rendered.set(id, panel);
		}

		// Show active panel
		content.innerHTML = '';
		content.appendChild(rendered.get(id));
	}

	function addTab(tab) {
		// Don't add duplicates
		if (tabs.find((t) => t.id === tab.id)) {
			setActive(tab.id);
			return;
		}
		tabs.push(tab);
		addButton(tab);
		setActive(tab.id);
	}

	// Activate first tab
	if (tabs.length > 0) {
		setActive(tabs[0].id);
	}

	return { setActive, addTab };
}
