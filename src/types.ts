export interface ProfilePoint {
	intensity: number;
	time: number;
}

export interface ProfileChannel {
	name: string;
	points: ProfilePoint[];
}

export interface LightProfile {
	version: number;
	channels: ProfileChannel[];
}

export interface ImportResult {
	fileName: string;
	profile: LightProfile;
	storedChecksum: number;
	computedChecksum: number;
	checksumValid: boolean;
}

export const MAX_INTENSITY = 2000;
export const MAX_TIME = 1440;

export interface ChannelMeta {
	label: string;
	color: string;
}

/** Display metadata for the known AI Hydra channel names, in the order the app shows them. */
export const CHANNEL_META: Record<string, ChannelMeta> = {
	uv: { label: 'UV', color: '#cc00bb' },
	violet: { label: 'Violet', color: '#7a00d4' },
	royal: { label: 'Royal Blue', color: '#2222cc' },
	blue: { label: 'Blue', color: '#1f7fd4' },
	green: { label: 'Green', color: '#22aa44' },
	deep_red: { label: 'Deep Red', color: '#cc2233' },
	moonlight: { label: 'Moonlight', color: '#b0a878' },
	cool_white: { label: 'Cool White', color: '#12b5b5' }
};

export function channelMeta(name: string): ChannelMeta {
	return CHANNEL_META[name] ?? { label: name, color: '#888888' };
}

export function formatTime(minutes: number): string {
	const m = ((minutes % 1440) + 1440) % 1440;
	const h24 = Math.floor(m / 60);
	const mins = m % 60;
	const suffix = h24 < 12 ? 'AM' : 'PM';
	let h12 = h24 % 12;
	if (h12 === 0) h12 = 12;
	const label = `${h12}:${mins.toString().padStart(2, '0')}${suffix}`;
	return minutes === 1440 ? label + ' (end)' : label;
}
