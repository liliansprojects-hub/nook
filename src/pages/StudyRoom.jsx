import { base44 } from '@/api/base44Client';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { ChevronLeft, Coffee, Pencil, Play, Settings2 } from 'lucide-react';
import SessionBar from '@/components/room/SessionBar';
import SessionFinishDialog from '@/components/room/SessionFinishDialog';
import SessionReceipt from '@/components/room/SessionReceipt';
import Desk from '@/components/room/Desk';
import IdeaBoard from '@/components/room/IdeaBoard';
import StickyLists from '@/components/room/StickyLists';
import LogList from '@/components/session/LogList';
import RoomDialog from '@/components/RoomDialog';
import { useStudySession } from '@/lib/useStudySession';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'board', label: 'idea board' },
  { id: 'notes', label: 'sticky notes' },
  { id: 'log', label: 'session log' },
];

export default function StudyRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isFree = id === 'free';
  const [room, setRoom] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [tab, setTab] = useState('board');
  const [finishOpen, setFinishOpen] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [roomDialog, setRoomDialog] = useState(false);
  const [loading, setLoading] = useState(true);

  const { active, session, start, finish } = useStudySession();
  const here = active && ((isFree && session.isFree) || (!isFree && session.roomId === id));

  const loadRoom = async () => {
    try {
      if (isFree) {
        setRoom({ id: '', name: 'free study', theme: 'oat', description: 'tag it when you finish.' });
      } else {
        const found = await base44.entities.StudyRoom.get(id);
        if (found?.deleted) navigate('/');
        setRoom(found);
      }
    } catch (err) {
      navigate('/');
    }
    setLoading(false);
  };

  const loadSessions = async () => {
    try {
      const query = isFree
        ? { is_free: true, deleted: { $ne: true } }
        : { room_id: id, deleted: { $ne: true } };
      const page = await base44.entities.StudySession.filter(query, { sort: '-created_date', limit: 25 });
      setSessions(page.items || []);
    } catch (err) {
      setSessions([]);
    }
  };

  useEffect(() => {
    loadRoom();
    loadSessions();
    base44.entities.Block.filter({ deleted: { $ne: true } }, { sort: 'created_date', limit: 300 })
      .then((page) => setBlocks(page.items || []))
      .catch(() => setBlocks([]));
  }, [id]);

  const endSession = async (meta) => {
    const result = await finish(meta);
    setFinishOpen(false);
    setReceipt(result);
    loadSessions();
  };

  if (loading || !room) {
    return <div className="h-40 animate-pulse rounded-[1.6rem] bg-secondary/70" />;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-1 text-[12px] font-extrabold text-muted-foreground">
          <ChevronLeft className="h-4 w-4" /> Nook
        </Link>
        {!isFree && (
          <Button variant="ghost" size="sm" className="h-9 rounded-full px-3 font-extrabold" onClick={() => setRoomDialog(true)}>
            <Settings2 className="mr-1.5 h-3.5 w-3.5" /> Room
          </Button>
        )}
      </div>

      <div className="surface flex items-center gap-3 p-5">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] tracking-[0.16em] text-muted-foreground">{isFree ? 'temporary room' : 'study room'}</p>
          <h1 className="font-heading text-2xl">{room.name}</h1>
          {room.description && <p className="mt-0.5 text-[12px] text-muted-foreground">{room.description}</p>}
        </div>
        <button
          type="button"
          onClick={() => (isFree ? start(null) : start(room))}
          disabled={here}
          className={cn('press grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand text-brand-on', here && 'opacity-40')}
          aria-label="start session"
        >
          <Play className="h-5 w-5" />
        </button>
      </div>

      {here ? (
        <SessionBar onFinish={() => setFinishOpen(true)} />
      ) : active ? (
        <div className="surface flex flex-wrap items-center gap-3 p-4">
          <p className="flex-1 text-[12px] text-muted-foreground">session running in {session.roomName}.</p>
          <Button
            size="sm"
            variant="outline"
            className="h-9 rounded-full font-extrabold"
            onClick={() => navigate(session.roomId ? `/room/${session.roomId}` : '/room/free')}
          >
            Back to it
          </Button>
          <Button size="sm" className="h-9 rounded-full font-extrabold" onClick={() => setFinishOpen(true)}>
            finish here
          </Button>
        </div>
      ) : (
        <div className="surface flex flex-wrap items-center gap-3 p-4">
          <p className="flex-1 text-[12px] text-muted-foreground">no session running.</p>
          <Button size="sm" className="h-9 rounded-full font-extrabold" onClick={() => start(isFree ? null : room)}>
            <Play className="mr-1.5 h-3.5 w-3.5" /> start
          </Button>
        </div>
      )}

      <Desk roomId={isFree ? '' : id} />

      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'rounded-full px-3.5 py-1.5 text-[12px] font-extrabold transition-colors',
              tab === t.id ? 'bg-foreground text-background' : 'bg-secondary text-muted-foreground'
            )}
          >
            {t.label}
          </button>
        ))}
        <Link
          to="/whiteboard"
          className="flex items-center gap-1.5 rounded-full bg-secondary px-3.5 py-1.5 text-[12px] text-muted-foreground"
        >
          <Pencil className="h-3.5 w-3.5" /> whiteboard
        </Link>
        <Link
          to={isFree ? '/cafe' : `/cafe?room=${id}`}
          className="flex items-center gap-1.5 rounded-full bg-brand-soft px-3.5 py-1.5 text-[12px] text-brand-ink"
        >
          <Coffee className="h-3.5 w-3.5" /> café
        </Link>
      </div>

      <div className="surface p-4">
        {tab === 'board' && <IdeaBoard roomId={isFree ? '' : id} />}
        {tab === 'notes' && <StickyLists roomId={isFree ? '' : id} />}
        {tab === 'log' && (
          <LogList
            sessions={sessions}
            blocks={blocks}
            onChanged={loadSessions}
            emptyText="nothing logged in this room yet."
          />
        )}
      </div>

      <SessionFinishDialog
        open={finishOpen}
        onOpenChange={setFinishOpen}
        session={session}
        blocks={blocks}
        onFinish={endSession}
      />

      <SessionReceipt receipt={receipt} open={!!receipt} onOpenChange={() => setReceipt(null)} />

      {!isFree && (
        <RoomDialog
          open={roomDialog}
          onOpenChange={setRoomDialog}
          room={room}
          onSaved={loadRoom}
          onDeleted={() => navigate('/')}
        />
      )}

      <p className="flex items-center justify-center gap-1.5 pb-4 text-[11px] font-bold text-muted-foreground">
        <Pencil className="h-3 w-3" /> the timer keeps running.
      </p>
    </div>
  );
}