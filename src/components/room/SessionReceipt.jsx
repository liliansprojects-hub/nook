import { Coins, MapPin, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { clock, humanDuration, timeLabel } from '@/lib/format';

export default function SessionReceipt({ receipt, open, onOpenChange }) {
  if (!receipt) return null;
  const orders = receipt.purchases || [];
  const spent = orders.reduce((sum, o) => sum + (o.price || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-[1.8rem]">
        <div className="text-center">
          <p className="text-[11px] tracking-[0.2em] text-muted-foreground">receipt</p>
          <h3 className="mt-1 font-heading text-2xl">{clock(receipt.duration_seconds)}</h3>
          <p className="text-[12px] text-muted-foreground">
            {receipt.room_name}
            {receipt.location ? ` · ${receipt.location}` : ''}
          </p>
        </div>

        <div className="my-4 space-y-2 rounded-[1.4rem] bg-secondary/70 p-4 text-sm font-semibold">
          <Row label="studied" value={humanDuration(receipt.duration_seconds)} />
          {receipt.break_seconds > 0 && <Row label="breaks" value={humanDuration(receipt.break_seconds)} />}
          {receipt.block_label && <Row label="tag" value={receipt.block_label} />}
          {receipt.description && <Row label="notes" value={receipt.description} />}
          <Row
            label="date"
            value={new Date(receipt.started_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          />
          <Row label="from" value={timeLabel(receipt.started_at)} />
        </div>

        <div className="space-y-2 rounded-[1.4rem] border border-dashed border-border p-4">
          <p className="text-[11px] tracking-[0.16em] text-muted-foreground">café</p>
          {orders.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">nothing bought.</p>
          ) : (
            orders.map((o) => (
              <div key={o.id} className="flex items-center justify-between text-[13px] font-bold">
                <span>{o.item_name}</span>
                <span className="text-muted-foreground">−{o.price}</span>
              </div>
            ))
          )}
          {orders.length > 0 && (
            <div className="flex items-center justify-between border-t border-border pt-2 text-[13px] font-extrabold">
              <span>spent</span>
              <span>−{spent}</span>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between rounded-[1.4rem] bg-brand-soft p-4 text-brand-ink">
          <span className="flex items-center gap-2 font-heading text-sm">
            <Coins className="h-4 w-4" /> earned
          </span>
          <span className="font-heading text-xl">{receipt.coins}</span>
        </div>

        <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          <Timer className="h-3 w-3" /> {Math.floor((receipt.duration_seconds || 0) / 60)} min × 8 coins
          {receipt.location && (
            <>
              <MapPin className="ml-1 h-3 w-3" /> {receipt.location}
            </>
          )}
        </p>

        <Button className="mt-3 h-12 w-full rounded-full font-medium" onClick={() => onOpenChange(false)}>
          close
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}