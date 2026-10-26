import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Check, Crop } from 'lucide-react';

const HANDLES = ['nw', 'ne', 'sw', 'se'];

export default function CropDialog({ open, onOpenChange, file, onDone }) {
  const [src, setSrc] = useState(null);
  const [box, setBox] = useState({ x: 0.08, y: 0.08, w: 0.84, h: 0.84 });
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const wrapRef = useRef(null);
  const imgRef = useRef(null);
  const drag = useRef(null);
  const previewUrl = useRef(null);

  const releasePreview = () => {
    if (previewUrl.current) {
      URL.revokeObjectURL(previewUrl.current);
      previewUrl.current = null;
    }
    setPreview(null);
  };

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setSrc(url);
    setBox({ x: 0.08, y: 0.08, w: 0.84, h: 0.84 });
    releasePreview();
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const clamp = (v) => Math.min(1, Math.max(0, v));

  const onDown = (mode) => (e) => {
    e.stopPropagation();
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { mode, startX: e.clientX, startY: e.clientY, box: { ...box } };
  };

  const onMove = (e) => {
    const d = drag.current;
    if (!d || !wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const dx = (e.clientX - d.startX) / rect.width;
    const dy = (e.clientY - d.startY) / rect.height;
    const b = { ...d.box };
    if (d.mode === 'move') {
      b.x = clamp(d.box.x + dx);
      b.y = clamp(d.box.y + dy);
      b.w = Math.min(b.w, 1 - b.x);
      b.h = Math.min(b.h, 1 - b.y);
    } else {
      const west = d.mode === 'nw' || d.mode === 'sw';
      const north = d.mode === 'nw' || d.mode === 'ne';
      if (west) {
        const nx = clamp(Math.min(d.box.x + dx, d.box.x + d.box.w - 0.08));
        b.w = d.box.w + (d.box.x - nx);
        b.x = nx;
      } else {
        b.w = clamp(d.box.w + dx);
      }
      if (north) {
        const ny = clamp(Math.min(d.box.y + dy, d.box.y + d.box.h - 0.08));
        b.h = d.box.h + (d.box.y - ny);
        b.y = ny;
      } else {
        b.h = clamp(d.box.h + dy);
      }
      if (b.x + b.w > 1) b.w = 1 - b.x;
      if (b.y + b.h > 1) b.h = 1 - b.y;
    }
    setBox(b);
  };

  const onUp = () => {
    drag.current = null;
  };

  const build = async (cropped) => {
    const img = imgRef.current;
    if (!img) return null;
    const naturalW = img.naturalWidth;
    const naturalH = img.naturalHeight;
    const max = 1600;
    const sw = cropped ? box.w * naturalW : naturalW;
    const sh = cropped ? box.h * naturalH : naturalH;
    const scale = Math.min(1, max / Math.max(sw, sh));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(sw * scale));
    canvas.height = Math.max(1, Math.round(sh * scale));
    const ctx = canvas.getContext('2d');
    ctx.drawImage(
      img,
      cropped ? box.x * naturalW : 0,
      cropped ? box.y * naturalH : 0,
      sw,
      sh,
      0,
      0,
      canvas.width,
      canvas.height
    );
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
    if (!blob) return null;
    return new File([blob], (file?.name || 'photo').replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
  };

  // Step 1 → step 2: build the crop and show it before anything is added.
  const showPreview = async (cropped) => {
    setBusy(true);
    try {
      const built = await build(cropped);
      if (!built) return;
      releasePreview();
      const url = URL.createObjectURL(built);
      previewUrl.current = url;
      setPreview({ url, file: built });
    } finally {
      setBusy(false);
    }
  };

  const confirm = () => {
    if (!preview) return;
    onOpenChange(false);
    onDone(preview.file);
    releasePreview();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) releasePreview();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-lg rounded-[1.8rem]">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl font-medium">
            {preview ? 'here is your photo' : 'crop your photo'}
          </DialogTitle>
        </DialogHeader>

        {preview ? (
          <>
            <div className="grid place-items-center rounded-[1.4rem] bg-secondary/60 p-3">
              <img src={preview.url} alt="Cropped preview" className="max-h-[52vh] rounded-[1.1rem] object-contain" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="h-11 flex-1 rounded-full font-medium" onClick={() => releasePreview()}>
                <Crop className="mr-1.5 h-4 w-4" /> adjust
              </Button>
              <Button className="h-11 flex-1 rounded-full font-medium" onClick={confirm}>
                <Check className="mr-1.5 h-4 w-4" /> add this photo
              </Button>
            </div>
          </>
        ) : (
          <>
            <div
              ref={wrapRef}
              className="relative select-none overflow-hidden rounded-[1.4rem] bg-secondary"
              onPointerMove={onMove}
              onPointerUp={onUp}
            >
              {src && (
                <img ref={imgRef} src={src} alt="To crop" className="max-h-[52vh] w-full object-contain" draggable={false} />
              )}

              <div className="pointer-events-none absolute inset-0 bg-foreground/45" />
              <div
                className="absolute touch-none border-2 border-white/90"
                style={{
                  left: `${box.x * 100}%`,
                  top: `${box.y * 100}%`,
                  width: `${box.w * 100}%`,
                  height: `${box.h * 100}%`,
                }}
                onPointerDown={onDown('move')}
                onPointerMove={onMove}
                onPointerUp={onUp}
              >
                <span
                  className="absolute inset-0"
                  style={{ boxShadow: '0 0 0 9999px rgba(20,12,8,0.45)', background: 'transparent' }}
                />
                {HANDLES.map((h) => (
                  <span
                    key={h}
                    onPointerDown={onDown(h)}
                    onPointerMove={onMove}
                    onPointerUp={onUp}
                    className="absolute h-5 w-5 touch-none rounded-full border-2 border-foreground/60 bg-white/90"
                    style={{
                      left: h.includes('w') ? -10 : undefined,
                      right: h.includes('e') ? -10 : undefined,
                      top: h.includes('n') ? -10 : undefined,
                      bottom: h.includes('s') ? -10 : undefined,
                      cursor: `${h}-resize`,
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="h-11 flex-1 rounded-full font-medium"
                onClick={() => showPreview(false)}
                disabled={busy}
              >
                Use full image
              </Button>
              <Button className="h-11 flex-1 rounded-full font-medium" onClick={() => showPreview(true)} disabled={busy}>
                <Crop className="mr-1.5 h-4 w-4" /> Preview crop
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}