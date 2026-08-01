import { ImportResult, LightProfile } from './types';
import { parseAip, serializeAip, validateProfile } from './aipFile';

// These functions run entirely in the browser - the app needs no backend. They keep the same
// shapes the UI expects so the rest of the app is unchanged from the original client/server version.

export async function importAip(file: File): Promise<ImportResult> {
	const xml = await file.text();
	try {
		return parseAip(xml, file.name);
	} catch (e) {
		throw new Error(`Not a valid .aip file: ${(e as Error).message}`);
	}
}

export function exportAip(fileName: string, profile: LightProfile): void {
	const errors = validateProfile(profile);
	if (errors.length > 0) throw new Error(errors.join(' '));

	const xml = serializeAip(profile);
	const name = fileName.toLowerCase().endsWith('.aip') ? fileName : fileName + '.aip';
	const blob = new Blob([xml], { type: 'application/octet-stream' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = name;
	a.click();
	URL.revokeObjectURL(url);
}
