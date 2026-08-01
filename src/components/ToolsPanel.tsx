import { useState } from 'react';
import { channelMeta } from '../types';

interface ToolsPanelProps {
	selectedChannel: string;
	canUndo: boolean;
	onShift(minutes: number): void;
	onScale(factor: number, channelName?: string): void;
	onUndo(): void;
	onRevert(): void;
}

export function ToolsPanel(props: ToolsPanelProps) {
	const [customShift, setCustomShift] = useState(60);
	const [scalePercent, setScalePercent] = useState(100);
	const [scaleTarget, setScaleTarget] = useState<'all' | 'selected'>('all');

	const applyScale = (percent: number) => {
		if (percent <= 0) return;
		props.onScale(percent / 100, scaleTarget === 'selected' ? props.selectedChannel : undefined);
	};

	return (
		<div className="tools">
			<fieldset>
				<legend>Shift whole schedule</legend>
				<div className="btn-row">
					<button onClick={() => props.onShift(-60)}>-1h</button>
					<button onClick={() => props.onShift(-30)}>-30m</button>
					<button onClick={() => props.onShift(-10)}>-10m</button>
					<button onClick={() => props.onShift(10)}>+10m</button>
					<button onClick={() => props.onShift(30)}>+30m</button>
					<button onClick={() => props.onShift(60)}>+1h</button>
				</div>
				<div className="btn-row">
					<input
						type="number"
						value={customShift}
						step={5}
						onChange={e => setCustomShift(Number(e.target.value))}
					/>
					<span className="unit">min</span>
					<button onClick={() => props.onShift(customShift)}>Apply shift</button>
				</div>
				<p className="hint">All channels move together; points wrap around midnight.</p>
			</fieldset>

			<fieldset>
				<legend>Scale intensity</legend>
				<div className="btn-row">
					<button onClick={() => applyScale(90)}>-10%</button>
					<button onClick={() => applyScale(95)}>-5%</button>
					<button onClick={() => applyScale(105)}>+5%</button>
					<button onClick={() => applyScale(110)}>+10%</button>
				</div>
				<div className="btn-row">
					<input
						type="number"
						value={scalePercent}
						min={1}
						max={400}
						onChange={e => setScalePercent(Number(e.target.value))}
					/>
					<span className="unit">%</span>
					<select value={scaleTarget} onChange={e => setScaleTarget(e.target.value as 'all' | 'selected')}>
						<option value="all">all channels</option>
						<option value="selected">{channelMeta(props.selectedChannel).label} only</option>
					</select>
					<button onClick={() => applyScale(scalePercent)}>Apply scale</button>
				</div>
				<p className="hint">Multiplies every point's intensity; clamped at 200% (HD limit).</p>
			</fieldset>

			<fieldset>
				<legend>History</legend>
				<div className="btn-row">
					<button onClick={props.onUndo} disabled={!props.canUndo}>
						Undo
					</button>
					<button onClick={props.onRevert}>Revert to imported</button>
				</div>
			</fieldset>
		</div>
	);
}
