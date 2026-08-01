import { LightProfile, CHANNEL_META, channelMeta } from '../types';
import { intensityAt } from '../transforms';

interface ChannelPanelProps {
	profile: LightProfile;
	selectedChannel: string;
	visibleChannels: Set<string>;
	cursorTime: number;
	onSelect(name: string): void;
	onToggleVisible(name: string): void;
	onAddChannel(name: string): void;
}

export function ChannelPanel(props: ChannelPanelProps) {
	const existing = new Set(props.profile.channels.map(c => c.name));
	const missing = Object.keys(CHANNEL_META).filter(n => !existing.has(n));

	return (
		<div className="channel-panel">
			<h3>Channels</h3>
			{props.profile.channels.map(c => {
				const meta = channelMeta(c.name);
				const value = intensityAt(c.points, props.cursorTime);
				const selected = c.name === props.selectedChannel;
				return (
					<div
						key={c.name}
						className={'channel-row' + (selected ? ' selected' : '')}
						onClick={() => props.onSelect(c.name)}
					>
						<input
							type="checkbox"
							checked={props.visibleChannels.has(c.name)}
							onClick={e => e.stopPropagation()}
							onChange={() => props.onToggleVisible(c.name)}
							title="Show / hide on chart"
						/>
						<span className="swatch" style={{ background: meta.color }} />
						<span className="channel-name">{meta.label}</span>
						<span className="channel-value" style={{ color: meta.color }}>
							{(value / 10).toFixed(value >= 1000 ? 0 : 1)}%
						</span>
					</div>
				);
			})}
			{missing.length > 0 && (
				<div className="add-channel">
					<label>Add channel:</label>
					<select
						value=""
						onChange={e => {
							if (e.target.value) props.onAddChannel(e.target.value);
						}}
					>
						<option value="">choose...</option>
						{missing.map(n => (
							<option key={n} value={n}>
								{channelMeta(n).label}
							</option>
						))}
					</select>
				</div>
			)}
		</div>
	);
}
