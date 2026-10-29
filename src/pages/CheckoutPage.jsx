import { base44 } from '@/api/base44Client';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Check, ChevronLeft, Coins, CreditCard, Gift, Loader2, Lock, Minus, Plus, Tag, Trash2 } from 'lucide-react';
import { readBasket, writeBasket, setQty, removeLine, clearBasket, countItems, declineFree, restoreFree } from '@/lib/cafeBasket';
import { dailyOffers, quote } from '@/lib/cafeOffers';
import { useWallet } from '@/lib/useWallet';
import { getActiveSession, useStudySession } from '@/lib/useStudySession';
import { grantDevCoins, isDevCode } from '@/lib/devCoins';
import { toast } from '@/components/ui/use-toast';
import ItemArt from '@/components/cafe/ItemArt';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import RoomDialog from '@/components/RoomDialog';
import { cn } from '@/lib/utils';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [basket, setBasket] = useState(readBasket);
  const [code, setCode] = useState('');
  const [applied, setApplied] = useState('');
  const [paying, setPaying] = useState(false);
  const [done, setDone] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [newRoom, setNewRoom] = useState(false);
  // where it lands: the room you're in, another one, a brand new one, or free study
  const [sendTo, setSendTo] = useState(() => readBasket().roomId || getActiveSession()?.roomId || '');
  const wallet = useWallet();
  const offers = dailyOffers();
  // the café only serves while a study room is open (a running session)
  const { active: roomOpen, session: openSession } = useStudySession();

  useEffect(() => {
    base44.entities.StudyRoom
      .filter({ deleted: { $ne: true } }, { sort: '-created_date', limit: 50 })
      .then((page) => setRooms(page.items || []))
      .catch(() => setRooms([]));
  }, []);

  const sendToName = rooms.find((r) => r.id === sendTo)?.name || 'free study';
  const openRoomId = openSession?.roomId || '';
  const openRoom = rooms.find((r) => r.id === openRoomId);
  const otherRooms = rooms.filter((r) => r.id !== openRoomId);

  const applyCode = async () => {
    const value = code.trim();
    if (!value) return;
    if (isDevCode(value)) {
      // hidden developer code: coins, not a discount
      setCode('');
      setApplied('');
      const grant = await grantDevCoins();
      wallet.reload();
      toast({
        title: `+${grant.amount} coins`,
        description: grant.savedTo === 'device' ? 'Saved on this device for now.' : undefined,
      });
      return;
    }
    setApplied(value);
  };

  const choose = (id) => {
    setSendTo(id);
    update({ ...basket, roomId: id });
  };

  const update = (next) => {
    setBasket(writeBasket(next));
  };

  const { lines, subtotal, discounts, total, codeOk, offeredFree } = quote(basket.lines, { code: applied, skipFree: basket.skipFree });
  const balance = wallet.balance ?? wallet.earned - wallet.spent;
  const left = balance - total;
  const backTo = sendTo ? `/room/${sendTo}` : '/cafe';

  const pay = async () => {
    const session = getActiveSession();
    if (!session) {
      // the session ended while the payment sheet was open
      toast({ title: 'No study room is open', description: 'Start a session in a study room to order from the café.' });
      return null;
    }
    const orders = lines.map((line) => ({
      session_key: session?.key || '',
      session_id: '',
      room_id: sendTo,
      item_id: line.id,
      item_name: line.name,
      item_kind: line.kind,
      price: line.lineTotal,
      unit_price: line.unit,
      quantity: line.qty || 1,
      options_text: line.options_text || '',
      paid_at: new Date().toISOString(),
      remaining: 100,
      desk_x: 14 + Math.round(Math.random() * 72),
      desk_y: 94, // arrives near the front edge; the desk then finds each item a free spot
    }));

    await base44.entities.Purchase.bulkCreate(orders);
    wallet.reload();
    update(clearBasket(basket));
    return { orders, total };
  };

  if (done) {
    return (
      <div className="mx-auto max-w-md space-y-4 pt-6 text-center">
        <div className="surface p-8">
          <span className="mx-auto grid h-16 w-16 animate-pop-in place-items-center rounded-full bg-brand-soft text-brand-ink">
            <Check className="h-7 w-7" />
          </span>
          <h1 className="mt-4 font-heading text-2xl font-medium">order paid</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {done.orders.length} item{done.orders.length === 1 ? '' : 's'} · {done.total} coins
          </p>
          <p className="mt-3 text-[12px] font-bold text-muted-foreground">on the desk in {sendToName}.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="h-12 flex-1 rounded-full font-medium" onClick={() => navigate('/cafe')}>
            back to the café
          </Button>
          <Button className="h-12 flex-1 rounded-full font-medium" onClick={() => navigate(backTo)}>
            close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <Link to="/cafe" className="flex items-center gap-1 text-[12px] text-muted-foreground">
          <ChevronLeft className="h-4 w-4" /> back to the café
        </Link>
        <span className="text-[11px] text-muted-foreground">
          {countItems(basket)} item{countItems(basket) === 1 ? '' : 's'}
        </span>
      </div>

      <h1 className="font-heading text-2xl font-black">checkout</h1>

      {lines.length === 0 ? (
        <div className="surface p-10 text-center text-[13px] text-muted-foreground">basket empty.</div>
      ) : (
        <>
          <div className="surface divide-y divide-border/60 p-2">
            {lines.map((line) => (
              <div key={line.key} className="flex items-center gap-3 p-3">
                <ItemArt item={line} className="h-14 w-14 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px]">{line.name}</p>
                  {line.options_text && <p className="truncate text-[11px] text-muted-foreground">{line.options_text}</p>}
                  <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    {line.free ? (
                      <span className="text-brand">free · {line.free_reason}</span>
                    ) : line.featured ? (
                      <>
                        <span className="line-through">{line.wasUnit}</span>
                        <span className="text-destructive">50% off</span>
                      </>
                    ) : (
                      <span>{line.unit} each</span>
                    )}
                  </p>
                </div>
                {line.free ? (
                  <>
                    <span className="text-[12px] font-bold text-brand">+0</span>
                    <button
                      type="button"
                      aria-label={`Remove free ${line.name}`}
                      className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground"
                      onClick={() => update(declineFree(basket))}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-1 rounded-full bg-secondary p-1">
                      <button
                        type="button"
                        aria-label="Less"
                        className="grid h-7 w-7 place-items-center rounded-full bg-card"
                        onClick={() => update(setQty(basket, line.key, (line.qty || 1) - 1))}
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center text-[12px]">{line.qty}</span>
                      <button
                        type="button"
                        aria-label="More"
                        className="grid h-7 w-7 place-items-center rounded-full bg-card"
                        onClick={() => update(setQty(basket, line.key, (line.qty || 1) + 1))}
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <span className="w-12 text-right text-[13px]">{line.lineTotal}</span>
                    <button
                      type="button"
                      aria-label={`Remove ${line.name}`}
                      className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground"
                      onClick={() => update(removeLine(basket, line.key))}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>

          {offeredFree.length > 0 && (
            <div className="surface flex items-center gap-3 p-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[0.8rem] bg-brand-soft text-brand-ink">
                <Gift className="h-4 w-4" />
              </span>
              <p className="min-w-0 flex-1 truncate text-[12px] text-muted-foreground">
                free {offeredFree[0].name} · {offeredFree[0].free_reason}
              </p>
              <Button variant="secondary" className="h-9 rounded-full px-4 text-[12px] font-medium" onClick={() => update(restoreFree(basket))}>
                add it
              </Button>
            </div>
          )}

          <div className="surface p-4">
            <p className="mb-2 text-[11px] font-bold tracking-[0.14em] text-muted-foreground">send to</p>
            <div className="flex flex-wrap gap-2">
              {openRoom && (
                <Chip active={sendTo === openRoom.id} onClick={() => choose(openRoom.id)}>
                  {openRoom.name} · open
                </Chip>
              )}
              <Chip active={!sendTo} onClick={() => choose('')}>
                free study
              </Chip>
              <Chip onClick={() => setNewRoom(true)}>+ new room</Chip>
              {otherRooms.map((room) => (
                <Chip key={room.id} active={sendTo === room.id} onClick={() => choose(room.id)}>
                  {room.name}
                </Chip>
              ))}
            </div>
          </div>

          <div className="surface p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[0.8rem] bg-secondary text-muted-foreground">
                <Tag className="h-4 w-4" />
              </span>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') applyCode();
                }}
                placeholder={`code (today: ${offers.code})`}
                className="h-10 min-w-[140px] flex-1 rounded-full border border-input bg-card px-3.5 text-[12px] outline-none focus:border-brand"
              />
              <Button
                className="h-10 rounded-full px-4 font-medium"
                variant={codeOk ? 'secondary' : 'default'}
                onClick={applyCode}
              >
                {codeOk ? 'applied' : 'apply'}
              </Button>
            </div>
            {applied && !codeOk && (
              <p className="mt-2 text-[11px] text-destructive">wrong code — try {offers.code}</p>
            )}
          </div>

          <div className="surface space-y-2 p-4 text-[13px]">
            <Row label="subtotal" value={`${subtotal} coins`} />
            {discounts.map((d) => (
              <div key={d.id} className="flex items-center justify-between text-brand">
                <span>{d.label}</span>
                <span>−{d.amount}</span>
              </div>
            ))}
            {lines
              .filter((l) => l.free)
              .map((l) => (
                <div key={l.key} className="flex items-center justify-between text-brand">
                  <span>free {l.name} · {l.free_reason}</span>
                  <span>+0</span>
                </div>
              ))}
            <div className="flex items-center justify-between border-t border-border pt-2 font-medium">
              <span>total</span>
              <span className="flex items-center gap-1">
                <Coins className="h-3.5 w-3.5" /> {total} coins
              </span>
            </div>
            <div className="flex items-center justify-between text-[12px] text-muted-foreground">
              <span>{balance} coins</span>
              <span className={left < 0 ? 'text-destructive' : ''}>{left} after</span>
            </div>
          </div>

          {!roomOpen && (
            <div className="surface flex items-center gap-3 p-4">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[0.8rem] bg-secondary text-muted-foreground">
                <Lock className="h-4 w-4" />
              </span>
              <p className="min-w-0 flex-1 text-[12px] text-muted-foreground">
                no study room is open. start a session in a room, then come back to order.
              </p>
              <Link to="/" className="shrink-0 rounded-full bg-secondary px-3.5 py-2 text-[12px] text-foreground">
                rooms
              </Link>
            </div>
          )}

          <Button
            className={cn('h-14 w-full rounded-full font-medium')}
            disabled={!roomOpen || left < 0 || total === 0}
            onClick={() => roomOpen && setPaying(true)}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            {!roomOpen ? 'open a study room to order' : left < 0 ? `need ${Math.abs(left)} more coins` : `pay ${total} coins`}
          </Button>
        </>
      )}

      <PaymentSheet
        open={paying}
        onOpenChange={setPaying}
        total={total}
        balance={balance}
        onConfirm={async () => {
          const receipt = await pay();
          setPaying(false);
          if (receipt) setDone(receipt);
        }}
      />

      <RoomDialog
        open={newRoom}
        onOpenChange={setNewRoom}
        onSaved={(room) => {
          if (!room?.id) return;
          setRooms((prev) => [room, ...prev.filter((r) => r.id !== room.id)]);
          choose(room.id);
        }}
      />
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between text-muted-foreground">
      <span>{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full px-3.5 py-1.5 text-[12px] font-bold transition-colors',
        active ? 'bg-brand text-brand-on' : 'bg-secondary text-muted-foreground'
      )}
    >
      {children}
    </button>
  );
}

// The paying moment: a real transaction-style animation before the receipt.
function PaymentSheet({ open, onOpenChange, total, balance, onConfirm }) {
  const [phase, setPhase] = useState('ready');
  const [progress, setProgress] = useState(0);

  const start = async () => {
    setPhase('paying');
    setProgress(0);
    const timer = setInterval(() => setProgress((p) => Math.min(96, p + 6)), 80);
    await new Promise((resolve) => setTimeout(resolve, 1400));
    clearInterval(timer);
    setProgress(100);
    await onConfirm();
    setPhase('ready');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (phase === 'paying' ? null : onOpenChange(v))}>
      <DialogContent className="max-w-sm rounded-[1.9rem]">
        <div className="text-center">
          {phase === 'paying' ? (
            <>
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-soft text-brand-ink">
                <Loader2 className="h-7 w-7 animate-spin" />
              </span>
              <h2 className="mt-4 font-heading text-lg font-medium">paying…</h2>
              <p className="text-[12px] text-muted-foreground">checking your coins</p>
              <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-brand transition-all duration-100" style={{ width: `${progress}%` }} />
              </div>
            </>
          ) : (
            <>
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-secondary text-muted-foreground">
                <CreditCard className="h-7 w-7" />
              </span>
              <h2 className="mt-4 font-heading text-lg font-medium">{total} coins</h2>
              <p className="text-[12px] text-muted-foreground">{balance} coins earned · nothing charged.</p>
              <div className="mt-5 flex gap-2">
                <Button variant="outline" className="h-12 flex-1 rounded-full font-medium" onClick={() => onOpenChange(false)}>
                  cancel
                </Button>
                <Button className="h-12 flex-1 rounded-full font-medium" onClick={start}>
                  pay
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}