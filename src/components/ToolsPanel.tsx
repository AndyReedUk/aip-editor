import { useEffect, useState } from 'react';
import { channelMeta } from '../types';

interface ToolsPanelProps {
	selectedChannel: string;
	canUndo: boolean;
	scalePct: number;
	scaleTarget: 'all' | 'selected';
	onShift(minutes: number): void;
	onScale(pct: number): void;
	onScaleTargetChange(target: 'all' | 'selected'): void;
	onUndo(): void;
	onRevert(): void;
}

export function ToolsPanel(props: ToolsPanelProps) {
	const [customShift, setCustomShift] = useState(60);
	const [levelField, setLevelField] = useState(props.scalePct);

	// Mirror the master level into the editable field whenever it changes via the +/- buttons or a re-baseline.
	useEffect(() => setLevelField(props.scalePct), [props.scalePct]);

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
				<legend>Master intensity</legend>
				<div className="btn-row">
					<button onClick={() => props.onScale(props.scalePct - 10)}>-10%</button>
					<button onClick={() => props.onScale(props.scalePct - 5)}>-5%</button>
					<button onClick={() => props.onScale(props.scalePct + 5)}>+5%</button>
					<button onClick={() => props.onScale(props.scalePct + 10)}>+10%</button>
				</div>
				<div className="btn-row">
					<input
						type="number"
						value={levelField}
						min={0}
						max={400}
						onChange={e => setLevelField(Number(e.target.value))}
					/>
					<span className="unit">%</span>
					<select
						value={props.scaleTarget}
						onChange={e => props.onScaleTargetChange(e.target.value as 'all' | 'selected')}
					>
						<option value="all">all channels</option>
						<option value="selected">{channelMeta(props.selectedChannel).label} only</option>
					</select>
					<button onClick={() => props.onScale(levelField)}>Set level</button>
				</div>
				<p className="hint">
					Level relative to the imported / last-edited profile (100% = unchanged). Boosts into HD up to 200% per
					channel where there's headroom; set back to 100% to return exactly. Resets to 100% after any other edit.
				</p>
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
