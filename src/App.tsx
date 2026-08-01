import { useEffect, useRef, useState } from 'react';
import { exportAip, importAip } from './api';
import { cloneProfile, scaleProfile, shiftProfile } from './transforms';
import { ImportResult, LightProfile, ProfilePoint } from './types';
import { ChannelPanel } from './components/ChannelPanel';
import { ChartEditor } from './components/ChartEditor';
import { PointTable } from './components/PointTable';
import { ToolsPanel } from './components/ToolsPanel';

interface EditState {
	profile: LightProfile | null;
	history: LightProfile[];
}

export default function App() {
	const [state, setState] = useState<EditState>({ profile: null, history: [] });
	const [original, setOriginal] = useState<LightProfile | null>(null);
	const [importInfo, setImportInfo] = useState<ImportResult | null>(null);
	const [fileName, setFileName] = useState('profile.aip');
	const [selectedChannel, setSelectedChannel] = useState('');
	const [visibleChannels, setVisibleChannels] = useState<Set<string>>(new Set());
	const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
	const [cursorTime, setCursorTime] = useState(720);
	const [error, setError] = useState('');
	const pendingBaseRef = useRef<LightProfile | null>(null);

	const profile = state.profile;
	const history = state.history;

	function mutate(next: LightProfile, commit: boolean) {
		if (!profile) return;
		// During a drag (commit=false) remember the pre-drag profile once, so the whole drag undoes as one step.
		if (!commit && !pendingBaseRef.current) pendingBaseRef.current = cloneProfile(profile);
		const base = commit ? pendingBaseRef.current ?? cloneProfile(profile) : null;
		if (commit) pendingBaseRef.current = null;
		setState(s => {
			if (!s.profile) return s;
			return base ? { profile: next, history: [...s.history.slice(-99), base] } : { ...s, profile: next };
		});
	}

	function undo() {
		setState(s =>
			s.history.length === 0 ? s : { profile: s.history[s.history.length - 1], history: s.history.slice(0, -1) }
		);
		setSelectedPoint(null);
	}

	function handlePointsChange(channelName: string, points: ProfilePoint[], commit: boolean) {
		if (!profile) return;
		mutate({ ...profile, channels: profile.channels.map(c => (c.name === channelName ? { ...c, points } : c)) }, commit);
	}

	async function handleImport(file: File) {
		setError('');
		try {
			const result = await importAip(file);
			setImportInfo(result);
			setState({ profile: result.profile, history: [] });
			setOriginal(cloneProfile(result.profile));
			setFileName(result.fileName);
			setSelectedChannel(result.profile.channels[0]?.name ?? '');
			setVisibleChannels(new Set(result.profile.channels.map(c => c.name)));
			setSelectedPoint(null);
			pendingBaseRef.current = null;
		} catch (e) {
			setError((e as Error).message);
		}
	}

	function handleExport() {
		if (!profile) return;
		setError('');
		try {
			exportAip(fileName, profile);
		} catch (e) {
			setError((e as Error).message);
		}
	}

	function addChannel(name: string) {
		if (!profile) return;
		mutate(
			{ ...profile, channels: [...profile.channels, { name, points: [{ intensity: 0, time: 0 }, { intensity: 0, time: 1440 }] }] },
			true
		);
		setVisibleChannels(v => new Set([...v, name]));
		setSelectedChannel(name);
	}

	useEffect(() => {
		function onKey(e: KeyboardEvent) {
			if (e.key !== 'Delete' || selectedPoint === null || !profile) return;
			if ((e.target as HTMLElement).tagName === 'INPUT') return;
			const ch = profile.channels.find(c => c.name === selectedChannel);
			if (!ch) return;
			handlePointsChange(selectedChannel, ch.points.filter((_, i) => i !== selectedPoint), true);
			setSelectedPoint(null);
		}
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});

	const channel = profile?.channels.find(c => c.name === selectedChannel);

	return (
		<div
			className="app"
			onDragOver={e => e.preventDefault()}
			onDrop={e => {
				e.preventDefault();
				const f = e.dataTransfer.files[0];
				if (f) void handleImport(f);
			}}
		>
			<header>
				<h1>AIP Profile Editor</h1>
				<label className="file-btn">
					Import .aip
					<input
						type="file"
						accept=".aip,.xml"
						hidden
						onChange={e => {
							const f = e.target.files?.[0];
							if (f) void handleImport(f);
							e.target.value = '';
						}}
					/>
				</label>
				{profile && (
					<div className="export-controls">
						<input value={fileName} onChange={e => setFileName(e.target.value)} spellCheck={false} />
						<button className="primary" onClick={handleExport}>
							Export .aip
						</button>
					</div>
				)}
			</header>

			{error && <div className="banner error">{error}</div>}
			{importInfo && !importInfo.checksumValid && (
				<div className="banner warn">
					The imported file's checksum ({importInfo.storedChecksum}) does not match the data (expected{' '}
					{importInfo.computedChecksum}) - it was probably hand-edited. Exporting from here will write a valid checksum.
				</div>
			)}

			{!profile && (
				<div className="empty">
					<p>Import an AquaIllumination .aip lighting profile to get started.</p>
					<p className="hint">Choose a file above, or drag and drop one anywhere on this page.</p>
				</div>
			)}

			{profile && channel && (
				<>
					<div className="main">
						<ChannelPanel
							profile={profile}
							selectedChannel={selectedChannel}
							visibleChannels={visibleChannels}
							cursorTime={cursorTime}
							onSelect={name => {
								setSelectedChannel(name);
								setSelectedPoint(null);
							}}
							onToggleVisible={name =>
								setVisibleChannels(v => {
									const next = new Set(v);
									if (next.has(name)) next.delete(name);
									else next.add(name);
									return next;
								})
							}
							onAddChannel={addChannel}
						/>
						<div className="center">
							<ChartEditor
								profile={profile}
								selectedChannel={selectedChannel}
								visibleChannels={visibleChannels}
								selectedPoint={selectedPoint}
								cursorTime={cursorTime}
								onCursorChange={setCursorTime}
								onSelectPoint={setSelectedPoint}
								onPointsChange={handlePointsChange}
							/>
							<ToolsPanel
								selectedChannel={selectedChannel}
								canUndo={history.length > 0}
								onShift={m => profile && mutate(shiftProfile(profile, m), true)}
								onScale={(f, ch) => profile && mutate(scaleProfile(profile, f, ch), true)}
								onUndo={undo}
								onRevert={() => {
									if (!original || !profile) return;
									mutate(cloneProfile(original), true);
									setSelectedPoint(null);
								}}
							/>
						</div>
					</div>
					<PointTable
						channel={channel}
						selectedPoint={selectedPoint}
						onSelectPoint={setSelectedPoint}
						onPointsChange={handlePointsChange}
					/>
				</>
			)}
			<footer className="app-footer">
				Compatible with AquaIllumination AI Hydra / Prime lighting profiles. This is an independent tool and is
				not affiliated with, endorsed by, or supported by AquaIllumination. All editing happens in your browser -
				no files are uploaded anywhere.
			</footer>
		</div>
	);
}
