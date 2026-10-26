const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Search } from 'lucide-react';
import LogList from '@/components/session/LogList';
import { startSession } from '@/lib/useStudySession';
import { humanDuration } from '@/lib/format';
import { cn } from '@/lib/utils';

const PAGE = 25;

export default function Sessions() {
  const navigate = useNavigate();
  const [blocks, setBlocks] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [rows, setRows] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [blockId, setBlockId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [search, setSearch] = useState('');
  const [term, setTerm] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setTerm(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    (async () => {
      try {
        const [blockPage, roomPage] = await Promise.all([
          db.entities.Block.filter({ deleted: { $ne: true } }, { sort: 'created_date', limit: 300 }),
          db.entities.StudyRoom.filter({ deleted: { $ne: true } }, { sort: '-created_date', limit: 50 }),
        ]);
        setBlocks(blockPage.items || []);
        setRooms(roomPage.items || []);
        const stats = await db.entities.StudySession.aggregate({
          query: { deleted: { $ne: true } },
          groupBy: 'block_id',
          sum: ['duration_seconds', 'coins'],
        });
        setRows(stats?.rows || []);
      } catch (err) {
        setRows([]);
      }
    })();
  }, []);

  const buildQuery = () => {
    const query = { deleted: { $ne: true } };
    if (blockId === 'free') query.is_free = true;
    else if (blockId) query.block_id = blockId;
    if (roomId === 'free') query.is_free = true;
    else if (roomId) query.room_id = roomId;
    if (term) {
      query.$or = [
        { description: { $regex: term, $options: 'i' } },
        { room_name: { $regex: term, $options: 'i' } },
        { block_label: { $regex: term, $options: 'i' } },
        { location: { $regex: term, $options: 'i' } },
      ];
    }
    return query;
  };

  const load = async () => {
    setLoading(true);
    try {
      const page = await db.entities.StudySession.filter(buildQuery(), { sort: '-created_date', limit: PAGE });
      setSessions(page.items || []);
      setCursor(page.next_cursor || null);
      setHasMore(!!page.has_more);
    } catch (err) {
      setSessions([]);
    }
    setLoading(false);
  };

  const loadMore = async () => {
    if (!cursor) return;
    const page = await db.entities.StudySession.filter(buildQuery(), {
      sort: '-created_date',
      limit: PAGE,
      cursor,
    });
    setSessions((prev) => [...prev, ...(page.items || [])]);
    setCursor(page.next_cursor || null);
    setHasMore(!!page.has_more);
  };

  useEffect(() => {
    load();
  }, [blockId, roomId, term]);

  const totalSeconds = rows.reduce((sum, r) => sum + (r.sum_duration_seconds || 0), 0);
  const totalCoins = rows.reduce((sum, r) => sum + (r.sum_coins || 0), 0);
  const tagged = rows.filter((r) => r.block_id);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl">log</h1>
          <p className="text-[12px] text-muted-foreground">
            {humanDuration(totalSeconds)} studied · {totalCoins} coins
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            className="h-11 rounded-full bg-brand-soft font-extrabold text-brand-ink hover:bg-brand-soft/80 hover:text-brand-ink"
            onClick={() => navigate('/stats')}
          >
            stats
          </Button>
          <Button
            className="h-11 rounded-full font-extrabold"
            onClick={() => {
              startSession(null);
              navigate('/room/free');
            }}
          >
            <Play className="mr-2 h-4 w-4" /> free study
          </Button>
        </div>
      </div>

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
        <Chip active={blockId === ''} onClick={() => setBlockId('')}>
          all
        </Chip>
        <Chip active={blockId === 'free'} onClick={() => setBlockId('free')}>
          free study
        </Chip>
        {tagged.map((row) => {
          const block = blocks.find((b) => b.id === row.block_id);
          return (
            <Chip key={row.block_id} active={blockId === row.block_id} onClick={() => setBlockId(row.block_id)}>
              {block?.title || 'Untitled'} · {humanDuration(row.sum_duration_seconds || 0)}
            </Chip>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex h-11 min-w-[220px] flex-1 items-center gap-2 rounded-full border border-input bg-card px-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="search"
            className="h-full flex-1 bg-transparent text-[13px] font-bold outline-none"
          />
        </div>
        <Select value={roomId || 'all'} onValueChange={(value) => setRoomId(value === 'all' ? '' : value)}>
          <SelectTrigger
            aria-label="Filter by room"
            className="h-11 w-[168px] shrink-0 rounded-full border-input bg-card px-4 text-[12px] font-extrabold"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">every room</SelectItem>
            <SelectItem value="free">free study</SelectItem>
            {rooms.map((room) => (
              <SelectItem key={room.id} value={room.id}>
                {room.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <LogList sessions={sessions} blocks={blocks} loading={loading} onChanged={load} />

      {hasMore && (
        <div className="pb-6 text-center">
          <Button variant="outline" className="h-10 rounded-full" onClick={loadMore}>
            more
          </Button>
        </div>
      )}
    </div>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-full px-3.5 py-2 text-[12px] font-extrabold transition-colors',
        active ? 'bg-foreground text-background' : 'bg-secondary text-muted-foreground hover:text-foreground'
      )}
    >
      {children}
    </button>
  );
}