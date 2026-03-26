/**
 * Generic table detail tab — renders any parsed table as a collapsible data tree.
 */

import { getTableDescription } from '../table-descriptions.js';

const COLLAPSE_THRESHOLD = 20; // Auto-collapse arrays/objects larger than this

/**
 * Create a table detail tab definition for a given table tag.
 */
export function createTableTab(tag, tableData) {
	return {
		id: `table:${tag.trim()}`,
		label: tag.trim(),
		className: 'tab-btn-sm',
		render(container, _fontData) {
			const wrap = document.createElement('div');
			wrap.className = 'table-detail';

			const header = document.createElement('div');
			header.className = 'table-detail-header';
			const description = getTableDescription(tag);
			header.innerHTML =
				`<h2>${escapeHTML(tag.trim())}</h2>` +
				(description
					? `<p class="table-detail-desc">${escapeHTML(description)}</p>`
					: '');
			wrap.appendChild(header);

			const tree = document.createElement('div');
			tree.className = 'data-tree';
			if (
				tableData &&
				typeof tableData === 'object' &&
				!Array.isArray(tableData) &&
				!ArrayBuffer.isView(tableData)
			) {
				const keys = Object.keys(tableData).filter((k) => !k.startsWith('_'));
				const internalKeys = Object.keys(tableData).filter((k) =>
					k.startsWith('_'),
				);
				for (const k of keys) {
					tree.appendChild(buildNode(tableData[k], k, true));
				}
				for (const k of internalKeys) {
					tree.appendChild(buildNode(tableData[k], k, false));
				}
			} else {
				tree.appendChild(buildNode(tableData, tag.trim(), true));
			}
			wrap.appendChild(tree);

			container.appendChild(wrap);
		},
	};
}

/**
 * Recursively build a DOM tree for a value.
 */
function buildNode(value, key, startOpen = false) {
	// Handle null/undefined
	if (value === null || value === undefined) {
		return makeLeaf(key, 'null', 'null');
	}

	// Handle typed arrays / ArrayBuffer
	if (ArrayBuffer.isView(value) || value instanceof ArrayBuffer) {
		const arr = value instanceof ArrayBuffer ? new Uint8Array(value) : value;
		if (arr.length <= 32) {
			return makeLeaf(
				key,
				`[${arr.join(', ')}]`,
				'bytes',
				`${arr.length} bytes`,
			);
		}
		return makeCollapsible(key, `${arr.length} bytes`, false, () => {
			const pre = document.createElement('pre');
			pre.className = 'data-bytes';
			pre.textContent = formatHexDump(arr);
			return pre;
		});
	}

	// Handle BigInt
	if (typeof value === 'bigint') {
		return makeLeaf(key, value.toString(), 'number');
	}

	// Handle arrays
	if (Array.isArray(value)) {
		if (value.length === 0) {
			return makeLeaf(key, '[]', 'empty', '0 items');
		}

		// Check if it's a simple number array (like instructions, values)
		if (value.length > 0 && value.every((v) => typeof v === 'number')) {
			if (value.length <= 20) {
				return makeLeaf(
					key,
					`[${value.join(', ')}]`,
					'array',
					`${value.length} numbers`,
				);
			}
			const open = startOpen && value.length < COLLAPSE_THRESHOLD;
			return makeCollapsible(key, `${value.length} numbers`, open, () => {
				const pre = document.createElement('pre');
				pre.className = 'data-number-array';
				// Show in rows of 16
				const rows = [];
				for (let i = 0; i < value.length; i += 16) {
					const chunk = value.slice(i, i + 16);
					rows.push(`[${String(i).padStart(4)}] ${chunk.join(', ')}`);
				}
				pre.textContent = rows.join('\n');
				return pre;
			});
		}

		// Array of objects/mixed
		const open = startOpen && value.length < COLLAPSE_THRESHOLD;
		return makeCollapsible(key, `${value.length} items`, open, () => {
			const list = document.createElement('div');
			list.className = 'data-children';
			for (let i = 0; i < value.length; i++) {
				list.appendChild(buildNode(value[i], String(i), false));
			}
			return list;
		});
	}

	// Handle objects
	if (typeof value === 'object') {
		const keys = Object.keys(value).filter((k) => !k.startsWith('_'));
		const internalKeys = Object.keys(value).filter((k) => k.startsWith('_'));

		if (keys.length === 0 && internalKeys.length === 0) {
			return makeLeaf(key, '{}', 'empty', '0 fields');
		}

		const totalKeys = keys.length + internalKeys.length;
		const open = startOpen && totalKeys < COLLAPSE_THRESHOLD;
		return makeCollapsible(key, `${totalKeys} fields`, open, () => {
			const list = document.createElement('div');
			list.className = 'data-children';
			// Show regular keys first, then internal
			for (const k of keys) {
				list.appendChild(buildNode(value[k], k, false));
			}
			if (internalKeys.length > 0) {
				for (const k of internalKeys) {
					list.appendChild(buildNode(value[k], k, false));
				}
			}
			return list;
		});
	}

	// Primitives
	const type = typeof value;
	if (type === 'boolean') {
		return makeLeaf(key, String(value), 'boolean');
	}
	if (type === 'number') {
		return makeLeaf(key, String(value), 'number');
	}
	// String
	const strVal = String(value);
	if (strVal.length > 200) {
		return makeCollapsible(key, `${strVal.length} chars`, false, () => {
			const pre = document.createElement('pre');
			pre.className = 'data-string-long';
			pre.textContent = strVal;
			return pre;
		});
	}
	return makeLeaf(key, strVal, 'string');
}

/**
 * A simple key: value leaf node.
 */
function makeLeaf(key, displayValue, type, badge) {
	const row = document.createElement('div');
	row.className = 'data-row';

	row.innerHTML = `
		<span class="data-key">${escapeHTML(key)}</span>
		<span class="data-value data-${type}">${escapeHTML(displayValue)}</span>
		${badge ? `<span class="data-badge">${escapeHTML(badge)}</span>` : ''}
	`;
	return row;
}

/**
 * A collapsible node (click to expand).
 */
function makeCollapsible(key, summary, startOpen, buildChildren) {
	const row = document.createElement('div');
	row.className = 'data-collapsible';

	const header = document.createElement('div');
	header.className = 'data-row data-row-toggle';
	header.innerHTML = `
		<span class="data-arrow">${startOpen ? '▼' : '▶'}</span>
		<span class="data-key">${escapeHTML(key)}</span>
		<span class="data-badge">${escapeHTML(summary)}</span>
	`;

	row.appendChild(header);

	let childContainer = null;
	let expanded = startOpen;

	if (startOpen) {
		childContainer = buildChildren();
		childContainer.classList.add('data-expanded');
		row.appendChild(childContainer);
	}

	header.addEventListener('click', () => {
		expanded = !expanded;
		header.querySelector('.data-arrow').textContent = expanded ? '▼' : '▶';

		if (expanded) {
			if (!childContainer) {
				childContainer = buildChildren();
				row.appendChild(childContainer);
			}
			childContainer.classList.add('data-expanded');
		} else if (childContainer) {
			childContainer.classList.remove('data-expanded');
		}
	});

	return row;
}

function formatHexDump(arr) {
	const rows = [];
	for (let i = 0; i < arr.length; i += 16) {
		const hex = [];
		const ascii = [];
		for (let j = 0; j < 16; j++) {
			if (i + j < arr.length) {
				hex.push(arr[i + j].toString(16).padStart(2, '0'));
				const c = arr[i + j];
				ascii.push(c >= 32 && c <= 126 ? String.fromCharCode(c) : '.');
			} else {
				hex.push('  ');
				ascii.push(' ');
			}
		}
		const offset = i.toString(16).padStart(6, '0');
		rows.push(
			`${offset}  ${hex.slice(0, 8).join(' ')}  ${hex.slice(8).join(' ')}  |${ascii.join('')}|`,
		);
	}
	return rows.join('\n');
}

function escapeHTML(str) {
	const div = document.createElement('div');
	div.textContent = str;
	return div.innerHTML;
}
