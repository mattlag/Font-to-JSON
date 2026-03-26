/**
 * Font Flux JS : bloc table
 * Apple Bitmap Location Table — binary-identical to EBLC/CBLC.
 */

import { parseCBLC, writeCBLC } from './table_CBLC.js';

export function parseBloc(rawBytes) {
	return parseCBLC(rawBytes);
}

export function writeBloc(bloc) {
	return writeCBLC(bloc);
}
