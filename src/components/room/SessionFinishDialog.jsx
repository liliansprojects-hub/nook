import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TAG_COLOURS } from '@/lib/accents';
import { cn } from '@/lib/utils';

export default function SessionFinishDialog({ open, onOpenChange, session, blocks = [], onFinish }) {
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [blockId, setBlockId] = useState('');
  const [roomName, setRoomName] = useState(session?.roomName || '');
  const [colour, setColour] = useState(TAG_COLOURS[0]);
  const [busy, setBusy] = useState(false);

  const block = blocks.find((b) => b.id === blockId);

  const submit = async () => {
    setBusy(true);
    try {
      await onFinish({
        description,
        location,
        blockId,
        blockLabel: block?.title || '',
        roomName: roomName || session?.roomName,
        tagColour: colour,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-[1.8rem]">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">finish session</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {session?.isFree && (
            <label className="block space-y-1.5">
              <span className="text-[12px] text-muted-foreground">room name</span>
              <Input value={roomName} onChange={(e) => setRoomName(e.target.value)} placeholder="rainy café" className="h-11" />
            </label>
          )}

          <label className="block space-y-1.5">
            <span className="text-[12px] text-muted-foreground">what did you do?</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="chapter 4…"
              className="w-full rounded-[1.2rem] border border-input bg-card p-3 text-sm outline-none focus:border-brand"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-[12px] text-muted-foreground">where?</span>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="library…"
              className="h-11"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-[12px] text-muted-foreground">tag</span>
            <Select value={blockId || 'none'} onValueChange={(value) => setBlockId(value === 'none' ? '' : value)}>
              <SelectTrigger className="h-11 w-full rounded-[1.2rem] border-input bg-card px-3 text-sm font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">no tag</SelectItem>
                {blocks.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <div className="space-y-1.5">
            <span className="text-[12px] text-muted-foreground">colour</span>
            <div className="flex flex-wrap gap-2">
              {TAG_COLOURS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColour(c)}
                  style={{ background: c }}
                  className={cn(
                    'h-7 w-7 rounded-full transition-transform',
                    colour === c ? 'scale-110 ring-2 ring-foreground ring-offset-2' : 'hover:scale-105'
                  )}
                  aria-label={`Colour ${c}`}
                />
              ))}
            </div>
          </div>

          <Button className="h-12 w-full rounded-full" onClick={submit} disabled={busy}>
            {busy ? 'saving…' : 'finish'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}