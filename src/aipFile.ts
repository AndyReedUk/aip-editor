import { ImportResult, LightProfile, ProfileChannel, ProfilePoint, MAX_INTENSITY, MAX_TIME } from './types';

// Client-side implementation of the .aip format: parse, serialise, checksum and validate.
// This runs entirely in the browser so the app can be hosted as a static site with no backend.
// The serialised output is byte-for-byte identical to the AquaIllumination app's native export.

/**
 * Computes the checksum the AI firmware/app expects for a colours XML block: the classic
 * JavaScript 31x string hash over the whitespace-stripped text, as a signed 32-bit integer,
 * bitwise-inverted when negative.
 */
export function computeChecksum(colorsXml: string): number {
	const stripped = colorsXml.replace(/\s+/g, '');
	let checksum = 0;
	for (let i = 0; i < stripped.length; i++) {
		checksum = ((checksum << 5) - checksum + stripped.charCodeAt(i)) | 0;
	}
	return checksum < 0 ? ~checksum : checksum;
}

/** Parses .aip XML content into a profile plus checksum validation detail. */
export function parseAip(xml: string, fileName: string): ImportResult {
	const doc = new DOMParser().parseFromString(xml, 'application/xml');
	if (doc.querySelector('parsererror')) throw new Error('file is not valid XML.');

	const ramp = doc.querySelector('ramp');
	if (!ramp) throw new Error('missing <ramp> element.');
	const colors = ramp.querySelector('colors');
	if (!colors) throw new Error('missing <colors> element.');

	const header = ramp.querySelector('header');
	const version = parseInt(header?.querySelector('version')?.textContent ?? '2', 10);
	const storedChecksum = parseInt(header?.querySelector('checksum')?.textContent ?? '0', 10);

	const channels: ProfileChannel[] = Array.from(colors.children).map(ch => ({
		name: ch.tagName,
		points: Array.from(ch.querySelectorAll('point')).map<ProfilePoint>(pt => ({
			intensity: parseInt(pt.querySelector('intensity')?.textContent ?? '0', 10),
			time: parseInt(pt.querySelector('time')?.textContent ?? '0', 10)
		}))
	}));

	const computedChecksum = computeChecksumFromSource(xml);
	const profile: LightProfile = { version, channels };
	return { fileName, profile, storedChecksum, computedChecksum, checksumValid: storedChecksum === computedChecksum };
}

/** Serialises a profile to .aip XML in the native app format, with a freshly computed checksum. */
export function serializeAip(profile: LightProfile): string {
	const colorsBlock = buildColorsBlock(profile.channels);
	const checksum = computeChecksum(colorsBlock);
	return (
		"<?xml version='1.0' encoding='UTF-8' standalone='yes' ?>\n" +
		'<ramp>\n' +
		'\t<header>\n' +
		`\t\t<version>${profile.version}</version>\n` +
		`\t\t<checksum>${checksum}</checksum>\n` +
		'\t</header>\n' +
		colorsBlock +
		'</ramp>\n'
	);
}

/** Validates a profile before export, returning human-readable problems. */
export function validateProfile(profile: LightProfile): string[] {
	const errors: string[] = [];
	if (profile.channels.length === 0) errors.push('Profile has no colour channels.');
	for (const channel of profile.channels) {
		if (channel.points.length === 0) errors.push(`Channel '${channel.name}' has no points.`);
		for (const p of channel.points) {
			if (p.intensity < 0 || p.intensity > MAX_INTENSITY)
				errors.push(`Channel '${channel.name}': intensity ${p.intensity} outside 0-${MAX_INTENSITY}.`);
			if (p.time < 0 || p.time > MAX_TIME)
				errors.push(`Channel '${channel.name}': time ${p.time} outside 0-${MAX_TIME}.`);
		}
		for (let i = 1; i < channel.points.length; i++) {
			if (channel.points[i].time < channel.points[i - 1].time) {
				errors.push(`Channel '${channel.name}': points are not in ascending time order.`);
				break;
			}
		}
	}
	return errors;
}

function buildColorsBlock(channels: ProfileChannel[]): string {
	let sb = '\t<colors>\n';
	for (const channel of channels) {
		sb += `\t\t<${channel.name}>\n`;
		for (const p of channel.points) {
			sb += '\t\t\t<point>\n';
			sb += `\t\t\t\t<intensity>${p.intensity}</intensity>\n`;
			sb += `\t\t\t\t<time>${p.time}</time>\n`;
			sb += '\t\t\t</point>\n';
		}
		sb += `\t\t</${channel.name}>\n`;
	}
	sb += '\t</colors>\n';
	return sb;
}

function computeChecksumFromSource(xml: string): number {
	const start = xml.indexOf('<colors>');
	const end = xml.indexOf('</colors>');
	if (start < 0 || end < 0) throw new Error('missing <colors> block.');
	return computeChecksum(xml.substring(start, end + '</colors>'.length));
}
