import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import CafeShop from '@/components/cafe/CafeShop';
import { getActiveSession } from '@/lib/useStudySession';

export default function CafePage() {
  const params = new URLSearchParams(window.location.search);
  const roomFromUrl = params.get('room') || '';
  const session = getActiveSession();
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

      <CafeShop roomId={roomId} />
    </div>
  );
}