const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Play, Plus, Sparkles } from 'lucide-react';
import RoomCard from '@/components/RoomCard';
import BlockFolder from '@/components/BlockFolder';
import AddBlockButton from '@/components/AddBlockButton';
import BlockDialog from '@/components/BlockDialog';
import BlockSheet from '@/components/BlockSheet';
import RoomDialog from '@/components/RoomDialog';
import { KINDS, KIND_ORDER } from '@/lib/blocks';
import { useCached, queueWrite } from '@/lib/offline';
import { startSession } from '@/lib/useStudySession';
import { startOfDay } from '@/lib/format';
import { cn } from '@/lib/utils';

export default function Home() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [newKind, setNewKind] = useState(null);
  const [openBlock, setOpenBlock] = useState(null);
  const [roomDialog, setRoomDialog] = useState(false);
  const [today, setToday] = useState({ minutes: 0, coins: 0, byRoom: {} });

  const { data, loading, reload } = useCached(
    'nook.home',
    async () => {
      const [roomPage, blockPage] = await Promise.all([
        db.entities.StudyRoom.filter({ deleted: { $ne: true } }, { sort: '-created_date', limit: 50 }),
        db.entities.Block.filter({ deleted: { $ne: true } }, { sort: 'created_date', limit: 300 }),
      ]);
      return { rooms: roomPage.items || [], blocks: blockPage.items || [] };
    },
    []
  );

  const rooms = data?.rooms || [];
  const blocks = data?.blocks || [];

  const loadToday = async () => {
    try {
      const res = await db.entities.StudySession.aggregate({
        query: { created_date: { $gte: startOfDay().toISOString() }, deleted: { $ne: true } },
        groupBy: 'room_id',
        sum: ['duration_seconds', 'coins'],
      });
      const rows = res?.rows || [];
      const byRoom = {};
      let seconds = 0;
      let coins = 0;
      rows.forEach((row) => {
        byRoom[row.room_id || 'free'] = Math.round((row.sum_duration_seconds || 0) / 60);
        seconds += row.sum_duration_seconds || 0;
        coins += row.sum_coins || 0;
      });
      setToday({ minutes: Math.round(seconds / 60), coins: Math.round(coins), byRoom });
    } catch (err) {
      setToday({ minutes: 0, coins: 0, byRoom: {} });
    }
  };

  useEffect(() => {
    loadToday();
  }, []);

  const ids = new Set(blocks.map((b) => b.id));
  const topLevel = blocks.filter((b) => !b.parent_id || !ids.has(b.parent_id));
  const filtered = filter === 'all' ? topLevel : topLevel.filter((b) => b.kind === filter);
  const present = KIND_ORDER.filter((k) => topLevel.some((b) => b.kind === k));

  const toggle = async (block) => {
    const patch = { done: !block.done };
    try {
      await db.entities.Block.update(block.id, patch);
    } catch (err) {
      queueWrite({ entity: 'Block', op: 'update', payload: { id: block.id, data: patch } });
    }
    reload();
  };

  const freeSession = () => {
    startSession(null);
    navigate('/room/free');
  };

  return (
    <div className="space-y-8">
      <section className="animate-fade-up">
        <p className="text-[12px] tracking-[0.14em] text-muted-foreground">
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <h1 className="mt-1 font-heading text-[28px] leading-tight tracking-tight md:text-4xl">
          your nook
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="pill bg-brand-soft px-3.5 py-2 text-brand-ink">
            <Sparkles className="h-3.5 w-3.5" /> {today.minutes} min · +{today.coins} coins
          </span>
          <button
            type="button"
            onClick={freeSession}
            className="press flex items-center gap-1.5 rounded-full bg-brand px-3.5 py-2 text-[12px] text-brand-ink"
          >
            <Play className="h-3.5 w-3.5" /> free study
          </button>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="font-heading text-lg">rooms</h2>
          <button type="button" onClick={() => setRoomDialog(true)} className="text-[12px] text-brand">
            new room
          </button>
        </div>

        {loading ? (
          <div className="flex gap-3 overflow-hidden">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[196px] w-[164px] shrink-0 animate-pulse rounded-[1.6rem] bg-secondary/70" />
            ))}
          </div>
        ) : (
          <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
            {rooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                minutes={today.byRoom[room.id] || 0}
                onClick={() => navigate(`/room/${room.id}`)}
              />
            ))}
            <button
              type="button"
              onClick={() => setRoomDialog(true)}
              className="press grid h-[196px] w-[120px] shrink-0 place-items-center rounded-[1.6rem] border-2 border-dashed border-border text-muted-foreground"
            >
              <Plus className="h-6 w-6" />
            </button>
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="font-heading text-lg">blocks</h2>
          <span className="text-[12px] text-muted-foreground">{topLevel.filter((b) => !b.done).length} open</span>
        </div>

        <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={cn(
              'shrink-0 rounded-full px-3.5 py-1.5 text-[12px] transition-colors',
              filter === 'all' ? 'bg-brand text-brand-on' : 'bg-secondary text-muted-foreground'
            )}
          >
            all
          </button>
          {present.map((kind) => (
            <button
              key={kind}
              type="button"
              onClick={() => setFilter(kind)}
              className={cn(
                'shrink-0 rounded-full px-3.5 py-1.5 text-[12px] transition-colors',
                filter === kind ? 'bg-brand text-brand-on' : 'bg-secondary text-muted-foreground'
              )}
            >
              {KINDS[kind].label}
            </button>
          ))}
        </div>

        {topLevel.length === 0 ? (
          <div className="rounded-[1.6rem] border-2 border-dashed border-border p-10 text-center">
            <p className="font-heading text-sm">no blocks yet</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((block) => (
              <BlockFolder
                key={block.id}
                block={block}
                blocks={blocks}
                onOpen={setOpenBlock}
                onToggle={toggle}
                onChanged={reload}
              />
            ))}
          </div>
        )}
      </section>

      <AddBlockButton onPick={(kind) => setNewKind(kind)} />

      <BlockDialog
        open={!!newKind}
        onOpenChange={() => setNewKind(null)}
        kind={newKind || 'task'}
        onSaved={reload}
      />

      <BlockSheet
        open={!!openBlock}
        onOpenChange={() => setOpenBlock(null)}
        block={openBlock}
        children={openBlock ? blocks.filter((b) => b.parent_id === openBlock.id) : []}
        onChanged={reload}
      />

      <RoomDialog open={roomDialog} onOpenChange={setRoomDialog} onSaved={reload} />
    </div>
  );
}