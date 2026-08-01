import { ProfileChannel, ProfilePoint, MAX_INTENSITY, MAX_TIME, channelMeta, formatTime } from '../types';

interface PointTableProps {
	channel: ProfileChannel;
	selectedPoint: number | null;
	onSelectPoint(index: number | null): void;
	onPointsChange(channelName: string, points: ProfilePoint[], commit: boolean): void;
}

export function PointTable(props: PointTableProps) {
	const pts = props.channel.points;
	const meta = channelMeta(props.channel.name);

	function update(index: number, field: keyof ProfilePoint, value: number, commit: boolean) {
		const next = pts.map(p => ({ ...p }));
		next[index] = { ...next[index], [field]: value };
		props.onPointsChange(props.channel.name, next, commit);
	}

	function normalize() {
		const next = pts
			.map(p => ({
				time: Math.min(MAX_TIME, Math.max(0, Math.round(p.time))),
				intensity: Math.min(MAX_INTENSITY, Math.max(0, Math.round(p.intensity)))
			}))
			.sort((a, b) => a.time - b.time);
		props.onPointsChange(props.channel.name, next, true);
	}

	function remove(index: number) {
		props.onPointsChange(props.channel.name, pts.filter((_, i) => i !== index), true);
		props.onSelectPoint(null);
	}

	function add() {
		const last = pts[pts.length - 1];
		const next = [...pts.map(p => ({ ...p })), { time: Math.min(MAX_TIME, (last?.time ?? 0) + 60), intensity: last?.intensity ?? 0 }];
		props.onPointsChange(props.channel.name, next, true);
	}

	return (
		<div className="point-table">
			<h3>
				<span className="swatch" style={{ background: meta.color }} /> {meta.label} points
			</h3>
			<table>
				<thead>
					<tr>
						<th>#</th>
						<th>Time (min)</th>
						<th>Clock</th>
						<th>Intensity (0-2000)</th>
						<th>%</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{pts.map((p, i) => (
						<tr
							key={i}
							className={i === props.selectedPoint ? 'selected' : ''}
							onClick={() => props.onSelectPoint(i)}
						>
							<td>{i + 1}</td>
							<td>
								<input
									type="number"
									value={p.time}
									min={0}
									max={MAX_TIME}
									onChange={e => update(i, 'time', Number(e.target.value), false)}
									onBlur={normalize}
								/>
							</td>
							<td className="clock">{formatTime(p.time)}</td>
							<td>
								<input
									type="number"
									value={p.intensity}
									min={0}
									max={MAX_INTENSITY}
									onChange={e => update(i, 'intensity', Number(e.target.value), false)}
									onBlur={normalize}
								/>
							</td>
							<td className="pct">{(p.intensity / 10).toFixed(1)}%</td>
							<td>
								<button className="danger" title="Delete point" onClick={e => { e.stopPropagation(); remove(i); }}>
									×
								</button>
							</td>
						</tr>
					))}
				</tbody>
			</table>
			<button onClick={add}>+ Add point</button>
			<p className="hint">Tip: double-click the chart to add a point; drag points to move them.</p>
		</div>
	);
}
