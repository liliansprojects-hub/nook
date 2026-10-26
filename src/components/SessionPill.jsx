import { useLocation, useNavigate } from 'react-router-dom';
import { Coins, Timer } from 'lucide-react';
import Draggable from '@/components/Draggable';
import { useStudySession } from '@/lib/useStudySession';
import { clock } from '@/lib/format';

// Floating session chip — the session keeps counting wherever you go in the app.
// Drag it anywhere; a tap opens the room it belongs to.
export default function SessionPill() {
  const { active, session, elapsedSec, coins, isPaused } = useStudySession();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  if (!active || pathname.startsWith('/room')) return null;

  return (
    <Draggable id="session-pill" defaultClass="right-4 top-20 md:right-8" className="z-30">
      <button
        type="button"
        onClick={() => navigate(session.roomId ? `/room/${session.roomId}` : '/room/free')}
        className="press flex items-center gap-2 rounded-full bg-brand px-3.5 py-2 text-brand-ink"
      >
        <Timer className="h-4 w-4" />
        <span className="font-heading text-sm tabular-nums">{clock(elapsedSec)}</span>
        <span className="flex items-center gap-1 text-[11px] opacity-80">
          <Coins className="h-3 w-3" /> {coins}
        </span>
        {isPaused && <span className="text-[10px] opacity-80">paused</span>}
      </button>
    </Draggable>
  );
}