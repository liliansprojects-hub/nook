import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Flag, Pause, Play, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

const KEY = 'nook.timer';
const PRESETS = [
  { label: '25 / 5', focus: 25, rest: 5 },
  { label: '50 / 10', focus: 50, rest: 10 },
  { label: '15 / 3', focus: 15, rest: 3 },
  { label: '45 / 15', focus: 45, rest: 15 },
];
const RADIUS = 108;
const CIRCUM = 2 * Math.PI * RADIUS;

function chime() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    [0, 0.22].forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + offset);
      gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + offset + 0.18);
      osc.start(ctx.currentTime + offset);
      osc.stop(ctx.currentTime + offset + 0.2);
    });
    setTimeout(() => ctx.close(), 900);
  } catch (err) {
    /* no sound available */
  }
  if (navigator.vibrate) navigator.vibrate(180);
}

export default function Timer() {
  const [mode, setMode] = useState('stopwatch');
  const [preset, setPreset] = useState(0);
  const [focusMin, setFocusMin] = useState(25);
  const [restMin, setRestMin] = useState(5);
  const [phase, setPhase] = useState('focus');
  const [running, setRunning] = useState(false);
  const [startedAt, setStartedAt] = useState(null);
  const [accumulated, setAccumulated] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [laps, setLaps] = useState([]);
  const [cycles, setCycles] = useState(0);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (saved) {
        setMode(saved.mode || 'stopwatch');
        setFocusMin(saved.focusMin || 25);
        setRestMin(saved.restMin || 5);
        setPhase(saved.phase || 'focus');
        setRunning(!!saved.running);
        setStartedAt(saved.startedAt || null);
        setAccumulated(saved.accumulated || 0);
      }
    } catch (err) {
      /* nothing saved */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ mode, focusMin, restMin, phase, running, startedAt, accumulated }));
    } catch (err) {
      /* nothing kept */
    }
  }, [mode, focusMin, restMin, phase, running, startedAt, accumulated]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(t);
  }, []);

  const elapsedMs = accumulated + (running && startedAt ? now - startedAt : 0);
  const totalMs = (phase === 'focus' ? focusMin : restMin) * 60000;
  const remainingMs = Math.max(0, totalMs - elapsedMs);
  const shown = mode === 'stopwatch' ? elapsedMs : remainingMs;

  useEffect(() => {
    if (mode !== 'timer' || !running || totalMs <= 0) return;
    if (elapsedMs >= totalMs) {
      chime();
      const next = phase === 'focus' ? 'rest' : 'focus';
      if (phase === 'focus') setCycles((c) => c + 1);
      setPhase(next);
      setAccumulated(0);
      setStartedAt(Date.now());
      setRunning(true);
    }
  }, [now, mode, running, elapsedMs, totalMs, phase]);

  const toggle = () => {
    if (running) {
      setAccumulated(elapsedMs);
      setStartedAt(null);
      setRunning(false);
    } else {
      setStartedAt(Date.now());
      setRunning(true);
    }
  };

  const reset = () => {
    setAccumulated(0);
    setStartedAt(null);
    setRunning(false);
    setLaps([]);
  };

  const choosePreset = (index) => {
    setPreset(index);
    setFocusMin(PRESETS[index].focus);
    setRestMin(PRESETS[index].rest);
    setPhase('focus');
    setAccumulated(0);
    setStartedAt(null);
    setRunning(false);
    setLaps([]);
  };

  const seconds = Math.floor(shown / 1000);
  const tenths = Math.floor((shown % 1000) / 100);
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  const progress = mode === 'stopwatch' ? (seconds % 60) / 60 : totalMs ? 1 - remainingMs / totalMs : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl">timer</h1>
        <p className="text-[12px] text-muted-foreground">focus, then rest.</p>
      </div>

      <div className="flex justify-center">
        <div className="flex gap-1.5 rounded-full bg-secondary p-1.5">
          {[
            { id: 'stopwatch', label: 'stopwatch' },
            { id: 'timer', label: 'timer' },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className={cn(
                'rounded-full px-5 py-2 text-[12px] font-extrabold transition-colors',
                mode === m.id ? 'bg-card text-foreground shadow-soft' : 'text-muted-foreground'
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="surface mx-auto flex max-w-md flex-col items-center p-8">
        <div className="relative grid h-[248px] w-[248px] place-items-center">
          <svg viewBox="0 0 240 240" className="absolute inset-0 -rotate-90">
            <circle cx="120" cy="120" r={RADIUS} fill="none" stroke="hsl(var(--border))" strokeWidth="6" />
            <circle
              cx="120"
              cy="120"
              r={RADIUS}
              fill="none"
              stroke={phase === 'rest' && mode === 'timer' ? 'hsl(var(--muted-foreground))' : 'hsl(var(--brand))'}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={CIRCUM}
              strokeDashoffset={CIRCUM * (1 - Math.min(1, Math.max(0, progress)))}
              style={{ transition: 'stroke-dashoffset 0.2s linear' }}
            />
          </svg>
          <div className="text-center">
            <p className="font-heading text-[46px] font-black leading-none tabular-nums">
              {mm}:{ss}
              {mode === 'stopwatch' && <span className="text-[22px] font-extrabold opacity-50">.{tenths}</span>}
            </p>
            <p className="mt-1.5 text-[11px] font-extrabold tracking-[0.16em] text-muted-foreground">
              {mode === 'timer' ? (phase === 'focus' ? 'focus' : 'rest') : 'elapsed'}
            </p>
            {mode === 'timer' && (
              <p className="mt-1 text-[11px] font-bold text-muted-foreground">
                {phase === 'focus' ? `${focusMin} min focus` : `${restMin} min rest`} · {cycles} done
              </p>
            )}
          </div>
        </div>

        <div className="mt-8 flex items-center gap-3">
          <Button size="icon" variant="outline" className="h-12 w-12 rounded-full" onClick={reset} aria-label="Reset">
            <RotateCcw className="h-5 w-5" />
          </Button>
          <Button className="h-12 rounded-full px-8 font-extrabold" onClick={toggle}>
            {running ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
            {running ? 'pause' : 'start'}
          </Button>
          {mode === 'stopwatch' ? (
            <Button
              size="icon"
              variant="outline"
              className="h-12 w-12 rounded-full"
              aria-label="Lap"
              onClick={() => setLaps((prev) => [elapsedMs, ...prev])}
              disabled={!running}
            >
              <Flag className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              size="icon"
              variant="outline"
              className="h-12 w-12 rounded-full"
              aria-label="Switch phase"
              onClick={() => {
                setPhase((p) => (p === 'focus' ? 'rest' : 'focus'));
                setAccumulated(0);
                setStartedAt(running ? Date.now() : null);
              }}
            >
              <Flag className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {mode === 'timer' ? (
        <div className="mx-auto max-w-md">
          <p className="mb-2 text-center text-[11px] font-extrabold tracking-[0.14em] text-muted-foreground">
            intervals
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {PRESETS.map((p, i) => (
              <button
                key={p.label}
                type="button"
                onClick={() => choosePreset(i)}
                className={cn(
                  'rounded-full px-4 py-2 text-[12px] font-extrabold transition-colors',
                  preset === i ? 'bg-brand text-brand-foreground' : 'bg-secondary text-muted-foreground'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-center gap-3">
            <NumberField label="focus" value={focusMin} onChange={(v) => setFocusMin(v)} />
            <NumberField label="rest" value={restMin} onChange={(v) => setRestMin(v)} />
          </div>
        </div>
      ) : (
        laps.length > 0 && (
          <div className="mx-auto max-w-md space-y-1.5">
            {laps.map((lap, i) => (
              <div key={i} className="flex justify-between rounded-[1rem] bg-secondary/70 px-4 py-2 text-[12px] font-extrabold">
                <span className="text-muted-foreground">lap {laps.length - i}</span>
                <span className="tabular-nums">
                  {String(Math.floor(lap / 60000)).padStart(2, '0')}:
                  {String(Math.floor((lap % 60000) / 1000)).padStart(2, '0')}.
                  {Math.floor((lap % 1000) / 100)}
                </span>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}

function NumberField({ label, value, onChange }) {
  return (
    <label className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2">
      <span className="text-[11px] font-extrabold text-muted-foreground">{label}</span>
      <input
        type="number"
        min="1"
        max="180"
        value={value}
        onChange={(e) => onChange(Math.max(1, Math.min(180, Number(e.target.value) || 1)))}
        className="w-12 bg-transparent text-center font-heading text-sm font-black outline-none"
      />
      <span className="text-[11px] font-bold text-muted-foreground">min</span>
    </label>
  );
}