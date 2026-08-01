import { useRef, useState } from 'react';
import { LightProfile, ProfilePoint, MAX_INTENSITY, MAX_TIME, channelMeta, formatTime } from '../types';

const VB_W = 960;
const VB_H = 440;
const ML = 52;
const MR = 16;
const MT = 16;
const MB = 30;
const PW = VB_W - ML - MR;
const PH = VB_H - MT - MB;

interface ChartEditorProps {
	profile: LightProfile;
	selectedChannel: string;
	visibleChannels: Set<string>;
	selectedPoint: number | null;
	cursorTime: number;
	onCursorChange(time: number): void;
	onSelectPoint(index: number | null): void;
	onPointsChange(channelName: string, points: ProfilePoint[], commit: boolean): void;
}

type DragState =
	| { kind: 'point'; index: number }
	| { kind: 'cursor' }
	| null;

export function ChartEditor(props: ChartEditorProps) {
	const svgRef = useRef<SVGSVGElement>(null);
	const [drag, setDrag] = useState<DragState>(null);

	const maxIntensity = Math.max(1000, ...props.profile.channels.flatMap(c => c.points.map(p => p.intensity)));
	const yMax = Math.ceil(maxIntensity / 250) * 250;

	const x = (t: number) => ML + (t / MAX_TIME) * PW;
	const y = (i: number) => MT + (1 - i / yMax) * PH;

	function eventToData(e: React.PointerEvent | React.MouseEvent): { time: number; intensity: number } {
		const rect = svgRef.current!.getBoundingClientRect();
		const px = ((e.clientX - rect.left) / rect.width) * VB_W;
		const py = ((e.clientY - rect.top) / rect.height) * VB_H;
		const time = Math.round(((px - ML) / PW) * MAX_TIME);
		const intensity = Math.round((1 - (py - MT) / PH) * yMax);
		return {
			time: Math.min(MAX_TIME, Math.max(0, time)),
			intensity: Math.min(MAX_INTENSITY, Math.max(0, intensity))
		};
	}

	const selected = props.profile.channels.find(c => c.name === props.selectedChannel);

	function movePoint(index: number, e: React.PointerEvent, commit: boolean) {
		if (!selected) return;
		const { time, intensity } = eventToData(e);
		const pts = selected.points.map(p => ({ ...p }));
		const lo = index > 0 ? pts[index - 1].time : 0;
		const hi = index < pts.length - 1 ? pts[index + 1].time : MAX_TIME;
		const snapped = Math.round(time / 5) * 5;
		pts[index] = { time: Math.min(hi, Math.max(lo, snapped)), intensity };
		props.onPointsChange(selected.name, pts, commit);
	}

	function handlePointerDown(e: React.PointerEvent) {
		(e.target as Element).setPointerCapture?.(e.pointerId);
		setDrag({ kind: 'cursor' });
		props.onCursorChange(eventToData(e).time);
		props.onSelectPoint(null);
	}

	function handlePointerMove(e: React.PointerEvent) {
		if (!drag) return;
		if (drag.kind === 'cursor') props.onCursorChange(eventToData(e).time);
		else movePoint(drag.index, e, false);
	}

	function handlePointerUp(e: React.PointerEvent) {
		if (drag?.kind === 'point') movePoint(drag.index, e, true);
		setDrag(null);
	}

	function handleDoubleClick(e: React.MouseEvent) {
		if (!selected) return;
		const { time, intensity } = eventToData(e);
		const pts = [...selected.points.map(p => ({ ...p })), { time: Math.round(time / 5) * 5, intensity }];
		pts.sort((a, b) => a.time - b.time);
		props.onPointsChange(selected.name, pts, true);
		props.onSelectPoint(pts.findIndex(p => p.time === Math.round(time / 5) * 5));
	}

	const hourTicks = [0, 240, 480, 720, 960, 1200, 1440];
	const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => Math.round(yMax * f));

	return (
		<svg
			ref={svgRef}
			viewBox={`0 0 ${VB_W} ${VB_H}`}
			className="chart"
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={handlePointerUp}
			onDoubleClick={handleDoubleClick}
		>
			<rect x={ML} y={MT} width={PW} height={PH} className="chart-bg" />
			{hourTicks.map(t => (
				<g key={t}>
					<line x1={x(t)} y1={MT} x2={x(t)} y2={MT + PH} className="grid" />
					<text x={x(t)} y={VB_H - 10} className="tick" textAnchor="middle">
						{t === 0 || t === 1440 ? '12AM' : formatTime(t).replace(':00', '')}
					</text>
				</g>
			))}
			{yTicks.map(v => (
				<g key={v}>
					<line x1={ML} y1={y(v)} x2={ML + PW} y2={y(v)} className="grid" />
					<text x={ML - 6} y={y(v) + 4} className="tick" textAnchor="end">
						{v / 10}%
					</text>
				</g>
			))}
			{yMax > 1000 && <line x1={ML} y1={y(1000)} x2={ML + PW} y2={y(1000)} className="grid-100" />}

			{props.profile.channels
				.filter(c => props.visibleChannels.has(c.name) && c.name !== props.selectedChannel)
				.map(c => (
					<polyline
						key={c.name}
						className="curve dim"
						points={c.points.map(p => `${x(p.time)},${y(p.intensity)}`).join(' ')}
						stroke={channelMeta(c.name).color}
					/>
				))}

			{selected && props.visibleChannels.has(selected.name) && (
				<g>
					<polyline
						className="curve active"
						points={selected.points.map(p => `${x(p.time)},${y(p.intensity)}`).join(' ')}
						stroke={channelMeta(selected.name).color}
					/>
					{selected.points.map((p, i) => (
						<circle
							key={i}
							cx={x(p.time)}
							cy={y(p.intensity)}
							r={i === props.selectedPoint ? 9 : 7}
							className="point"
							stroke={channelMeta(selected.name).color}
							fill={i === props.selectedPoint ? channelMeta(selected.name).color : '#ffffff'}
							onPointerDown={e => {
								e.stopPropagation();
								try {
									(e.target as Element).setPointerCapture(e.pointerId);
								} catch {
									// Pointer capture is best-effort; dragging still works while the pointer stays over the chart.
								}
								props.onSelectPoint(i);
								setDrag({ kind: 'point', index: i });
							}}
						/>
					))}
				</g>
			)}

			<g className="cursor">
				<line x1={x(props.cursorTime)} y1={MT - 4} x2={x(props.cursorTime)} y2={MT + PH} />
				<rect x={x(props.cursorTime) - 34} y={0} width={68} height={16} rx={8} className="cursor-label-bg" />
				<text x={x(props.cursorTime)} y={12} textAnchor="middle" className="cursor-label">
					{formatTime(props.cursorTime).replace(' (end)', '')}
				</text>
			</g>
		</svg>
	);
}
