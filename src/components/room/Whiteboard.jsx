import { base44 } from '@/api/base44Client';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Check, Eraser, Loader2, Pencil, Plus, Trash2, Undo2 } from 'lucide-react';
import { useSignedUrl } from '@/lib/files';
import { Image } from '@/components/ui/image';
import WhiteboardPreview from '@/components/room/WhiteboardPreview';
import { cn } from '@/lib/utils';

const COLOURS = ['#2B333A', '#DE7864', '#7EA56E', '#85BDC9', '#C79A3E'];
const SIZES = [2, 5, 11];
const HEIGHT = 380;

// A board is saved as the strokes that made it, not a picture of them — so
// saving needs no upload, and reopening redraws it at whatever size you like.
export default function Whiteboard({ roomId, blockId }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const strokes = useRef([]);
  const [colour, setColour] = useState(COLOURS[0]);
  const [size, setSize] = useState(SIZES[1]);
  const [eraser, setEraser] = useState(false);
  const [boards, setBoards] = useState([]);
  const [current, setCurrent] = useState(null);
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [savedId, setSavedId] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState('');

  const loadBoards = async () => {
    try {
      const page = await base44.entities.MediaItem.filter(
        { kind: 'whiteboard', room_id: roomId || '', deleted: { $ne: true } },
        { sort: '-created_date', limit: 20 }
      );
      setBoards(page.items || []);
    } catch (err) {
      setBoards([]);
    }
  };

  useEffect(() => {
    loadBoards();
  }, [roomId]);

  const ctx2d = () => canvasRef.current?.getContext('2d');

  // every stroke, drawn again at the width the canvas has right now
  const paint = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = ctx2d();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const dpr = window.devicePixelRatio || 1;
    ctx.scale(dpr, dpr);
    const width = canvas.clientWidth || 600;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    strokes.current.forEach((stroke) => {
      const scale = width / (stroke.w0 || width);
      ctx.strokeStyle = stroke.c;
      ctx.lineWidth = Math.max(1, stroke.w * scale);
      ctx.beginPath();
      stroke.p.forEach(([x, y], i) => {
        if (i === 0) ctx.moveTo(x * scale, y * scale);
        else ctx.lineTo(x * scale, y * scale);
      });
      if (stroke.p.length === 1) ctx.lineTo(stroke.p[0][0] * scale + 0.01, stroke.p[0][1] * scale);
      ctx.stroke();
    });
  };

  const resize = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = Math.max(1, canvas.parentElement?.clientWidth || 600);
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width === Math.round(width * dpr) && canvas.height === Math.round(HEIGHT * dpr)) return;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(HEIGHT * dpr);
    canvas.style.width = '100%';
    canvas.style.height = `${HEIGHT}px`;
    paint();
  };

  useEffect(() => {
    resize();
    const onResize = () => resize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const pos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return [Math.round(e.clientX - rect.left), Math.round(e.clientY - rect.top)];
  };

  const down = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    drawing.current = true;
    const point = pos(e);
    const stroke = {
      c: eraser ? '#ffffff' : colour,
      w: eraser ? size * 4 : size,
      w0: canvas.clientWidth || 600,
      p: [point],
    };
    strokes.current = [...strokes.current, stroke];
    setDirty(true);

    const ctx = ctx2d();
    ctx.fillStyle = stroke.c;
    ctx.beginPath();
    ctx.arc(point[0], point[1], stroke.w / 2, 0, Math.PI * 2);
    ctx.fill();
    canvas.setPointerCapture(e.pointerId);
  };

  const move = (e) => {
    if (!drawing.current) return;
    const stroke = strokes.current[strokes.current.length - 1];
    if (!stroke) return;
    const point = pos(e);
    const previous = stroke.p[stroke.p.length - 1];
    const ctx = ctx2d();
    ctx.strokeStyle = stroke.c;
    ctx.lineWidth = stroke.w;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(previous[0], previous[1]);
    ctx.lineTo(point[0], point[1]);
    ctx.stroke();
    stroke.p.push(point);
  };

  const up = () => {
    drawing.current = false;
  };

  const undo = () => {
    if (!strokes.current.length) return;
    strokes.current = strokes.current.slice(0, -1);
    setDirty(true);
    paint();
  };

  const clear = () => {
    strokes.current = [];
    setSavedId(null);
    setDirty(true);
    paint();
  };

  const openBoard = (board) => {
    if (!board.data) return;
    try {
      strokes.current = JSON.parse(board.data).strokes || [];
    } catch (err) {
      strokes.current = [];
    }
    paint();
    setCurrent(board);
    setTitle(board.title);
    setSavedId(board.id);
    setDirty(false);
  };

  const fresh = () => {
    strokes.current = [];
    setCurrent(null);
    setTitle('');
    setSavedId(null);
    setDirty(false);
    paint();
  };

  const save = async () => {
    if (savedId && !dirty) return;
    setBusy(true);
    setError('');
    try {
      const created = await base44.entities.MediaItem.create({
        title: title.trim() || 'whiteboard',
        kind: 'whiteboard',
        data: JSON.stringify({
          v: 1,
          w: canvasRef.current?.clientWidth || 600,
          h: HEIGHT,
          strokes: strokes.current,
        }),
        room_id: roomId || '',
        block_id: blockId || '',
      });
      setSavedId(created.id);
      setCurrent(created);
      setDirty(false);
      loadBoards();
    } catch (err) {
      setError(err.message || 'could not save this board');
    } finally {
      setBusy(false);
    }
  };

  const removeBoard = async (board) => {
    setBoards((prev) => prev.filter((b) => b.id !== board.id));
    if (savedId === board.id) setSavedId(null);
    await base44.entities.MediaItem.update(board.id, { deleted: true });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="mr-auto flex items-center gap-1.5 font-heading text-sm font-medium">
          <Pencil className="h-4 w-4 text-brand" /> whiteboard
          {savedId && !dirty && <span className="text-[11px] text-muted-foreground">· saved</span>}
          {savedId && dirty && <span className="text-[11px] text-muted-foreground">· unsaved</span>}
        </h3>
        <div className="flex items-center gap-1.5">
          {COLOURS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Colour ${c}`}
              onClick={() => {
                setColour(c);
                setEraser(false);
              }}
              className={cn('h-7 w-7 rounded-full border-2', colour === c && !eraser ? 'border-foreground' : 'border-transparent')}
              style={{ background: c }}
            />
          ))}
          <label
            aria-label="Custom colour"
            title="mix your own"
            className={cn(
              'relative h-7 w-7 cursor-pointer overflow-hidden rounded-full border-2',
              !COLOURS.includes(colour) ? 'border-foreground' : 'border-transparent'
            )}
            style={{
              background:
                'conic-gradient(hsl(0 70% 72%), hsl(60 70% 72%), hsl(120 70% 72%), hsl(180 70% 72%), hsl(240 70% 72%), hsl(300 70% 72%), hsl(360 70% 72%))',
            }}
          >
            <input
              type="color"
              value={colour}
              onChange={(e) => {
                setColour(e.target.value);
                setEraser(false);
              }}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </label>
        </div>
        <div className="flex items-center gap-1.5">
          {SIZES.map((s) => (
            <button
              key={s}
              type="button"
              aria-label={`Brush ${s}`}
              onClick={() => setSize(s)}
              className={cn('grid h-7 w-7 place-items-center rounded-full', size === s ? 'bg-foreground text-background' : 'bg-secondary text-muted-foreground')}
            >
              <span className="rounded-full bg-current" style={{ width: s + 3, height: s + 3 }} />
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setEraser((v) => !v)}
          aria-label="Eraser"
          className={cn('grid h-9 w-9 place-items-center rounded-full', eraser ? 'bg-foreground text-background' : 'bg-secondary text-muted-foreground')}
        >
          <Eraser className="h-4 w-4" />
        </button>
        <button type="button" onClick={undo} aria-label="Undo" className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-muted-foreground">
          <Undo2 className="h-4 w-4" />
        </button>
        <button type="button" onClick={clear} aria-label="Clear" className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-muted-foreground">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="overflow-hidden rounded-[1.4rem] border border-border/70 bg-white">
        <canvas
          ref={canvasRef}
          className="block w-full touch-none"
          style={{ height: HEIGHT }}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerLeave={up}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="board name"
          className="h-11 min-w-[160px] flex-1 rounded-full border border-input bg-card px-4 text-[13px] outline-none focus:border-brand"
        />
        <Button className="h-11 rounded-full px-4 font-medium" onClick={save} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="mr-1.5 h-4 w-4" /> save</>}
        </Button>
        <Button variant="ghost" size="sm" className="h-11 rounded-full font-medium" onClick={fresh}>
          <Plus className="mr-1.5 h-3.5 w-3.5" /> new
        </Button>
      </div>

      {error && <p className="text-[11px] text-destructive">{error}</p>}
      {current?.id && <p className="text-[11px] text-muted-foreground">editing “{current.title}”</p>}

      {boards.length === 0 ? (
        <p className="text-[12px] text-muted-foreground">nothing saved yet.</p>
      ) : (
        <div>
          <p className="mb-2 text-[11px] tracking-[0.16em] text-muted-foreground">boards</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {boards.map((board) => (
              <BoardTile
                key={board.id}
                board={board}
                active={savedId === board.id}
                onOpen={() => openBoard(board)}
                onRemove={() => removeBoard(board)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BoardTile({ board, active, onOpen, onRemove }) {
  const signed = useSignedUrl(board.file_uri);
  return (
    <div className={cn('surface group relative overflow-hidden', active && 'ring-2 ring-brand')}>
      <button type="button" onClick={onOpen} className="block w-full">
        {board.data ? (
          <WhiteboardPreview data={board.data} className="block h-24 w-full" />
        ) : signed ? (
          <Image src={signed} alt={board.title} fittingType="fit" className="h-24 w-full" />
        ) : (
          <span className="grid h-24 place-items-center text-muted-foreground">
            <Pencil className="h-4 w-4" />
          </span>
        )}
      </button>
      <div className="flex items-center justify-between gap-2 p-2">
        <span className="truncate text-[11px]">{board.title}</span>
        <button type="button" onClick={onRemove} aria-label="Delete board" className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}