/**
 * Diagnose tab — runs binary-level diagnostics on the original font file
 * and lists every issue with severity, explanation, and (where possible)
 * a "Fix it" action that mutates the in-memory font data.
 */
import { diagnoseFont } from 'font-flux-js';

// =========================================================================
//  Issue metadata: recommendation text + optional fix factory
// =========================================================================

/**
 * Per-code recommendation + optional auto-fix.  The `fix` function receives
 * `(fontData)` and should mutate it in place, returning a short string that
 * describes what was changed.
 */
const ISSUE_META = {
	// ── Errors ──────────────────────────────────────────────────────────
	NOT_ARRAYBUFFER: {
		rec: 'The input was not a binary buffer. Reload the file from disk.',
	},
	TOO_SHORT: {
		rec: 'The file is truncated \u2014 it does not even contain a complete header. Re-download or recover the file from a backup.',
	},
	BAD_SF_VERSION: {
		rec: 'The SFNT signature is unrecognized. The file may not be a real font, or only the first bytes are corrupted.',
	},
	NO_TABLES: {
		rec: 'The file header claims zero tables \u2014 there is nothing to work with. The file is severely damaged.',
	},
	DIRECTORY_TRUNCATED: {
		rec: 'The file is too short for the declared number of tables. It was likely truncated during download or transfer.',
	},
	HEADER_UNREADABLE: {
		rec: 'Could not read the SFNT header at all. The file may not be a font.',
	},
	DIRECTORY_ENTRY_UNREADABLE: {
		rec: 'A table directory entry is corrupted. The file is partially unreadable.',
	},
	BAD_TABLE_TAG: {
		rec: 'A table tag contains non-ASCII bytes — the directory may be corrupted.',
	},
	DUPLICATE_TABLE: {
		rec: 'Two tables share the same tag. This is invalid per the OpenType spec.',
	},
	TABLE_OUT_OF_BOUNDS: {
		rec: 'A table\u2019s declared offset+length extends past the end of the file. The file is truncated.',
	},
	MISSING_REQUIRED_TABLE: {
		rec: 'This font is missing a table that the OpenType spec requires every font to have. Most renderers will reject the file.',
	},
	NO_OUTLINES: {
		rec: 'No glyph outline data (glyf+loca or CFF/CFF2) was found. The font cannot render any glyphs.',
	},
	TABLE_PARSE_FAILED: {
		rec: 'A table\u2019s binary data could not be parsed \u2014 its internal structure is corrupted.',
	},
	BAD_MAGIC_NUMBER: {
		rec: 'The head table\u2019s magic number is wrong (expected 0x5F0F3CF5). This usually means the head table is corrupted.',
	},
	BAD_UNITS_PER_EM: {
		rec: 'unitsPerEm must be between 16 and 16384. An out-of-range value will cause renderers to reject the font.',
	},
	LOCA_BEYOND_GLYF: {
		rec: 'The loca table points past the end of the glyf table — some glyphs may be unreadable.',
	},
	GVAR_WITHOUT_FVAR: {
		rec: 'gvar (glyph variation data) is present but fvar (axis definitions) is missing. The variation data is useless.',
	},
	WOFF1_UNWRAP_FAILED: {
		rec: 'WOFF1 decompression failed. The compressed data may be corrupt — try the original uncompressed font.',
	},
	WOFF2_UNWRAP_FAILED: {
		rec: 'WOFF2 Brotli decompression failed. The compressed data may be corrupt — try the original uncompressed font.',
	},
	EMPTY_COLLECTION: {
		rec: 'The TTC/OTC collection header says it contains zero fonts.',
	},
	COLLECTION_HEADER_UNREADABLE: {
		rec: 'The TTC/OTC collection header is corrupted.',
	},
	NO_READABLE_ENTRIES: {
		rec: 'No table directory entries could be read at all. The file is severely damaged.',
	},

	// ── Warnings ────────────────────────────────────────────────────────
	BAD_CHECKSUM: {
		rec: 'Table checksums are used by OS font validators. Zeroed or mismatched checksums will cause Windows to reject the font. Re-exporting with Font Flux will recompute correct checksums.',
		fix(fontData) {
			// Re-export will automatically compute correct checksums.
			// We mark dirty so the user knows to export.
			fontData._dirty = true;
			return 'Font marked for re-export — checksums will be recomputed on export.';
		},
	},
	EXCESSIVE_TABLES: {
		rec: 'This font has an unusually large number of tables. It may be a specially crafted file.',
	},
	EMPTY_TABLE: {
		rec: 'A zero-length table is unusual and likely indicates a placeholder that was never populated.',
	},
	TABLE_MISALIGNED: {
		rec: 'Tables should start on 4-byte boundaries for optimal performance. Re-exporting will fix the alignment.',
		fix(fontData) {
			fontData._dirty = true;
			return 'Font marked for re-export — table alignment will be corrected on export.';
		},
	},
	MIXED_OUTLINES: {
		rec: 'Having both TrueType and CFF outlines is unusual. Most tools will only use one.',
	},
	BAD_SEARCH_RANGE: {
		rec: "The header's searchRange field is incorrect. Re-exporting will fix it.",
		fix(fontData) {
			fontData._dirty = true;
			return 'Font marked for re-export — header fields will be recomputed on export.';
		},
	},
	BAD_ENTRY_SELECTOR: {
		rec: "The header's entrySelector field is incorrect. Re-exporting will fix it.",
		fix(fontData) {
			fontData._dirty = true;
			return 'Font marked for re-export — header fields will be recomputed on export.';
		},
	},
	BAD_RANGE_SHIFT: {
		rec: "The header's rangeShift field is incorrect. Re-exporting will fix it.",
		fix(fontData) {
			fontData._dirty = true;
			return 'Font marked for re-export — header fields will be recomputed on export.';
		},
	},
	HMTX_GLYPH_MISMATCH: {
		rec: 'The number of horizontal metrics does not match maxp.numGlyphs. Some glyphs may have missing or incorrect widths.',
		fix(fontData) {
			fontData._dirty = true;
			return 'Font marked for re-export — hmtx will be rebuilt from glyph advance widths on export.';
		},
	},
	HHEA_HMTX_MISMATCH: {
		rec: 'hhea.numberOfHMetrics disagrees with the actual hmtx entries. Re-exporting will reconcile them.',
		fix(fontData) {
			fontData._dirty = true;
			return 'Font marked for re-export — hhea/hmtx will be reconciled on export.';
		},
	},
	VHEA_VMTX_MISMATCH: {
		rec: 'The vertical metrics header disagrees with the actual vmtx entries.',
	},
	CFF_GLYPH_MISMATCH: {
		rec: 'CFF charString count disagrees with maxp.numGlyphs.',
	},
	NO_FAMILY_NAME: {
		rec: 'The name table has no family name (nameID 1). Windows and macOS require this to install the font.',
		fix(fontData) {
			if (fontData.font) {
				const fallback =
					fontData.font.fullName ||
					fontData.font.postScriptName ||
					fontData._fileName?.replace(/\.[^.]+$/, '') ||
					'Untitled';
				fontData.font.familyName = fallback;
				fontData._dirty = true;
				return `Set familyName to "${fallback}".`;
			}
			return null;
		},
	},
	NO_STYLE_NAME: {
		rec: 'The name table has no style name (nameID 2). Defaulting to "Regular".',
		fix(fontData) {
			if (fontData.font) {
				fontData.font.styleName = fontData.font.styleName || 'Regular';
				fontData._dirty = true;
				return 'Set styleName to "Regular".';
			}
			return null;
		},
	},

	// ── Info ─────────────────────────────────────────────────────────────
	FORMAT_WOFF1: {
		rec: 'File is WOFF1-wrapped — this is normal for web fonts.',
	},
	FORMAT_WOFF2: {
		rec: 'File is WOFF2-wrapped — this is normal for web fonts.',
	},
	FORMAT_COLLECTION: { rec: 'File is a TTC/OTC font collection.' },
	WOFF1_UNWRAPPED: { rec: 'WOFF1 outer wrapper decompressed successfully.' },
	WOFF2_UNWRAPPED: { rec: 'WOFF2 Brotli wrapper decompressed successfully.' },
	SF_VERSION: { rec: 'The SFNT version signature is recognized.' },
	TABLE_PARSED: { rec: 'Table parsed without error.' },
	UNKNOWN_TABLE: {
		rec: 'This table tag is not in the OpenType standard, but it will be preserved as raw bytes.',
	},
	COLLECTION_INFO: { rec: 'Collection metadata read successfully.' },
};

// =========================================================================
//  Severity display
// =========================================================================

const SEVERITY_ICON = { error: '❌', warning: '⚠️', info: 'ℹ️' };
const SEVERITY_LABEL = { error: 'Error', warning: 'Warning', info: 'Info' };
const SEVERITY_CLASS = {
	error: 'dx-error',
	warning: 'dx-warning',
	info: 'dx-info',
};

// =========================================================================
//  Render
// =========================================================================

export const diagnoseTab = {
	id: 'diagnose',
	label: 'Diagnose',
	render,
};

function render(container, fontData, appContext) {
	const wrap = document.createElement('div');
	wrap.className = 'diagnose-page';

	const buffer = fontData._originalBuffer;
	if (!buffer) {
		wrap.innerHTML =
			'<p class="dx-empty">No original binary buffer available for diagnosis.</p>';
		container.appendChild(wrap);
		return;
	}

	const report = diagnoseFont(buffer);

	// ── Summary banner ──────────────────────────────────────────────────
	const banner = document.createElement('div');
	banner.className = report.valid
		? 'dx-banner dx-banner-ok'
		: 'dx-banner dx-banner-bad';

	const icon = report.valid ? '✅' : '🚫';
	const summaryParts = [];
	if (report.summary.errorCount)
		summaryParts.push(
			`${report.summary.errorCount} error${report.summary.errorCount !== 1 ? 's' : ''}`,
		);
	if (report.summary.warningCount)
		summaryParts.push(
			`${report.summary.warningCount} warning${report.summary.warningCount !== 1 ? 's' : ''}`,
		);
	if (report.summary.infoCount)
		summaryParts.push(
			`${report.summary.infoCount} info note${report.summary.infoCount !== 1 ? 's' : ''}`,
		);

	banner.innerHTML = `
		<span class="dx-banner-icon">${icon}</span>
		<span class="dx-banner-text">
			<strong>${report.valid ? 'No blocking errors detected' : 'Problems found'}</strong>
			<span class="dx-banner-counts">${summaryParts.join(', ')}</span>
		</span>
	`;

	// "Fix All" button if there's anything fixable
	const fixableIssues = report.issues.filter(
		(i) => i.severity !== 'info' && ISSUE_META[i.code]?.fix,
	);
	if (fixableIssues.length > 0) {
		const fixAllBtn = document.createElement('button');
		fixAllBtn.className = 'dx-fix-all-btn';
		fixAllBtn.textContent = `Fix All (${fixableIssues.length})`;
		fixAllBtn.addEventListener('click', () => {
			// Apply each fix and update its card's UI in place
			for (const btn of wrap.querySelectorAll('.dx-fix-btn')) {
				if (!btn.disabled) btn.click();
			}
			fixAllBtn.disabled = true;
			fixAllBtn.textContent = '✓ All fixed';
		});
		banner.appendChild(fixAllBtn);
	}

	wrap.appendChild(banner);

	// ── Issue list ──────────────────────────────────────────────────────
	// Group: errors first, then warnings, then info

	const groups = [
		{ severity: 'error', items: report.errors },
		{ severity: 'warning', items: report.warnings },
		{ severity: 'info', items: report.infos },
	];

	for (const group of groups) {
		if (group.items.length === 0) continue;

		const section = document.createElement('div');
		section.className = 'dx-section';

		const heading = document.createElement('h3');
		heading.className = `dx-section-heading ${SEVERITY_CLASS[group.severity]}`;
		heading.textContent = `${SEVERITY_ICON[group.severity]} ${SEVERITY_LABEL[group.severity]}s (${group.items.length})`;
		section.appendChild(heading);

		// Collapse infos by default
		let listContainer = section;
		if (group.severity === 'info') {
			const details = document.createElement('details');
			const summary = document.createElement('summary');
			summary.textContent = `${group.items.length} informational note${group.items.length !== 1 ? 's' : ''}`;
			summary.className = 'dx-info-summary';
			details.appendChild(summary);
			section.appendChild(details);
			listContainer = details;
		}

		for (const issue of group.items) {
			listContainer.appendChild(renderIssueCard(issue, fontData, appContext));
		}

		wrap.appendChild(section);
	}

	container.appendChild(wrap);
}

function renderIssueCard(issue, fontData, appContext) {
	const card = document.createElement('div');
	card.className = `dx-card ${SEVERITY_CLASS[issue.severity]}`;

	const meta = ISSUE_META[issue.code];
	const rec = meta?.rec || '';

	// Header row: icon + code + message
	const header = document.createElement('div');
	header.className = 'dx-card-header';
	header.innerHTML = `
		<span class="dx-card-icon">${SEVERITY_ICON[issue.severity]}</span>
		<code class="dx-card-code">${issue.code}</code>
		<span class="dx-card-msg">${escapeHTML(issue.message)}</span>
	`;
	card.appendChild(header);

	// Recommendation
	if (rec) {
		const recEl = document.createElement('div');
		recEl.className = 'dx-card-rec';
		recEl.innerHTML = `<strong>Recommendation:</strong> ${escapeHTML(rec)}`;
		card.appendChild(recEl);
	}

	// Fix button
	if (meta?.fix && issue.severity !== 'info') {
		const fixRow = document.createElement('div');
		fixRow.className = 'dx-card-fix';
		const fixBtn = document.createElement('button');
		fixBtn.className = 'dx-fix-btn';
		fixBtn.textContent = 'Fix it';
		fixBtn.addEventListener('click', () => {
			const result = meta.fix(fontData);
			if (result) {
				fixBtn.disabled = true;
				fixBtn.textContent = '✓ Fixed';
				const msg = document.createElement('span');
				msg.className = 'dx-fix-result';
				msg.textContent = result;
				fixRow.appendChild(msg);
				if (appContext?.markDirty) appContext.markDirty();
			}
		});
		fixRow.appendChild(fixBtn);
		card.appendChild(fixRow);
	}

	return card;
}

function escapeHTML(str) {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}
