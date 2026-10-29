import { Link } from 'react-router-dom';
import { ChevronLeft, Lock } from 'lucide-react';
import CafeShop from '@/components/cafe/CafeShop';
import { useStudySession } from '@/lib/useStudySession';

export default function CafePage() {
  const params = new URLSearchParams(window.location.search);
  const roomFromUrl = params.get('room') || '';
  const { session } = useStudySession();
  const roomId = roomFromUrl || session?.roomId || '';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Link
          to={roomId ? `/room/${roomId}` : '/'}
          className="flex items-center gap-1 text-[12px] text-muted-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> back
        </Link>
        {!session && <p className="text-[11px] text-muted-foreground">study to earn coins</p>}
      </div>

      <div>
        <h1 className="font-heading text-2xl font-medium">café</h1>
        <p className="text-[12px] text-muted-foreground">paid with study minutes.</p>
      </div>

      {!session && (
        <div className="surface flex items-center gap-3 p-4">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[0.8rem] bg-secondary text-muted-foreground">
            <Lock className="h-4 w-4" />
          </span>
          <p className="min-w-0 flex-1 text-[12px] text-muted-foreground">
            no study room is open. you can look around, but orders open once a session is running in a room.
          </p>
          <Link to="/" className="shrink-0 rounded-full bg-secondary px-3.5 py-2 text-[12px] text-foreground">
            rooms
          </Link>
        </div>
      )}

      <CafeShop roomId={roomId} />
    </div>
  );
}