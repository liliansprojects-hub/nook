const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, Film, Image as ImageIcon, Link2, Loader2, Upload } from 'lucide-react';
import CropDialog from '@/components/media/CropDialog';
import { cn } from '@/lib/utils';

const KINDS = [
  { id: 'link', label: 'link', icon: Link2 },
  { id: 'photo', label: 'photo', icon: ImageIcon },
  { id: 'video', label: 'video', icon: Film },
  { id: 'document', label: 'file', icon: FileText },
];

export default function UploadMediaDialog({ open, onOpenChange, roomId, blockId, onSaved }) {
  const [kind, setKind] = useState('link');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');
  const [file, setFile] = useState(null);
  const [cropping, setCropping] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setTitle('');
    setUrl('');
    setNote('');
    setFile(null);
    setError('');
    setKind('link');
  };

  const save = async () => {
    setError('');
    setBusy(true);
    try {
      let fileUri = '';
      if (kind !== 'link') {
        if (!file) {
          setError('choose a file first');
          setBusy(false);
          return;
        }
        const { file_uri } = await db.integrations.Core.UploadPrivateFile({ file });
        fileUri = file_uri;
      } else if (!url) {
        setError('paste a link first');
        setBusy(false);
        return;
      }

      await db.entities.MediaItem.create({
        title: title || file?.name || url,
        kind,
        url: kind === 'link' ? url : '',
        file_uri: fileUri,
        note,
        room_id: roomId || '',
        block_id: blockId || '',
      });

      reset();
      onOpenChange(false);
      onSaved?.();
    } catch (err) {
      setError(err.message || 'upload failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Dialog open={open && !cropping} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md rounded-[1.8rem]">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">add a pin</DialogTitle>
          </DialogHeader>

          <div className="flex gap-2">
            {KINDS.map((k) => (
              <button
                key={k.id}
                type="button"
                onClick={() => setKind(k.id)}
                className={cn(
                  'flex flex-1 flex-col items-center gap-1 rounded-[1.1rem] py-2.5 text-[11px] font-extrabold transition-colors',
                  kind === k.id ? 'bg-brand text-brand-foreground' : 'bg-secondary text-muted-foreground'
                )}
              >
                <k.icon className="h-4 w-4" />
                {k.label}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="title" className="h-11" />

            {kind === 'link' ? (
              <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" className="h-11" />
            ) : (
              <div className="space-y-2">
                <label className="flex h-24 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[1.3rem] border-2 border-dashed border-border text-[12px] font-extrabold text-muted-foreground">
                  <Upload className="h-5 w-5" />
                  {file ? file.name : `choose a ${kind}`}
                  <input
                    type="file"
                    className="hidden"
                    accept={kind === 'photo' ? 'image/*' : kind === 'video' ? 'video/*' : undefined}
                    onChange={(e) => {
                      const chosen = e.target.files?.[0] || null;
                      setFile(chosen);
                      if (chosen && kind === 'photo') setCropping(true);
                    }}
                  />
                </label>
                {file && kind === 'photo' && (
                  <button
                    type="button"
                    className="text-[11px] font-extrabold text-brand"
                    onClick={() => setCropping(true)}
                  >
                    crop
                  </button>
                )}
              </div>
            )}

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="note"
              className="w-full rounded-[1.2rem] border border-input bg-card p-3 text-sm outline-none focus:border-brand"
            />

            {error && <p className="text-[12px] font-bold text-destructive">{error}</p>}

            <Button className="h-12 w-full rounded-full" onClick={save} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'add'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <CropDialog
        open={cropping}
        onOpenChange={setCropping}
        file={file}
        onDone={(cropped) => {
          setFile(cropped);
          setCropping(false);
        }}
      />
    </>
  );
}