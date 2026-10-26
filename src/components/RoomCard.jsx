import { Clock } from 'lucide-react';

// A room reads as a quiet white card — the accent is the only colour in it.
export default function RoomCard({ room, minutes = 0, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="press surface group w-[164px] shrink-0 overflow-hidden p-3 text-left transition-transform duration-300 hover:-translate-y-1 sm:w-[188px]"
    >
      <div className="relative mb-2.5 h-[96px] overflow-hidden rounded-[1.2rem] bg-secondary/60">
        <div className="absolute inset-x-3 bottom-3 h-2 rounded-full bg-card" />
        <div className="absolute bottom-[18px] left-4 h-7 w-7 rounded-[0.7rem] bg-card" />
        <div className="absolute bottom-[18px] left-14 h-4 w-9 rounded-full bg-card" />
        <div className="absolute bottom-[26px] right-5 h-10 w-10 rounded-full bg-brand opacity-35 transition-transform duration-500 group-hover:translate-x-0.5" />
      </div>
      <div className="px-1 pb-1">
        <p className="truncate font-heading text-[15px] leading-tight">{room.name}</p>
        <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
          <Clock className="h-3 w-3" /> {minutes} min today
        </p>
      </div>
    </button>
  );
}