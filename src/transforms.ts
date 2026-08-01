import { LightProfile, ProfilePoint, MAX_INTENSITY, MAX_TIME } from './types';

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

/** Shifts every point of every channel by the given number of minutes, wrapping around midnight. */
export function shiftProfile(profile: LightProfile, minutes: number): LightProfile {
	return {
		...profile,
		channels: profile.channels.map(ch => ({ ...ch, points: shiftPoints(ch.points, minutes) }))
	};
}

function shiftPoints(points: ProfilePoint[], minutes: number): ProfilePoint[] {
	const shifted = points.map(p => ({ ...p, time: ((p.time + minutes) % MAX_TIME + MAX_TIME) % MAX_TIME }));
	shifted.sort((a, b) => a.time - b.time || a.intensity - b.intensity);
	// A pair of points at 0 and 1440 describes the same instant; drop exact duplicates created by the wrap.
	return shifted.filter((p, i) => i === 0 || p.time !== shifted[i - 1].time || p.intensity !== shifted[i - 1].intensity);
}

/** Scales all intensities by a factor (1.0 = unchanged), clamped to the valid range. Optionally one channel only. */
export function scaleProfile(profile: LightProfile, factor: number, channelName?: string): LightProfile {
	return {
		...profile,
		channels: profile.channels.map(ch =>
			channelName && ch.name !== channelName
				? ch
				: { ...ch, points: ch.points.map(p => ({ ...p, intensity: clamp(Math.round(p.intensity * factor), 0, MAX_INTENSITY) })) })
	};
}

/** Linearly interpolates a channel's intensity at an arbitrary time of day. */
export function intensityAt(points: ProfilePoint[], time: number): number {
	if (points.length === 0) return 0;
	if (time <= points[0].time) return points[0].intensity;
	const last = points[points.length - 1];
	if (time >= last.time) return last.intensity;
	for (let i = 1; i < points.length; i++) {
		const a = points[i - 1];
		const b = points[i];
		if (time <= b.time) {
			if (b.time === a.time) return b.intensity;
			return a.intensity + ((b.intensity - a.intensity) * (time - a.time)) / (b.time - a.time);
		}
	}
	return last.intensity;
}

/** Deep-clones a profile for the undo history. */
export function cloneProfile(profile: LightProfile): LightProfile {
	return JSON.parse(JSON.stringify(profile)) as LightProfile;
}
