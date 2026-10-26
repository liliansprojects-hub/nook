import { Coffee, Coins, Pause, Play, Square, Timer, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStudySession } from '@/lib/useStudySession';
import { clock } from '@/lib/format';
import { cn } from '@/lib/utils';

export default function SessionBar({ onFinish }) {
  const { active, isPaused, onBreak, elapsedSec, breakSec, coins, pause, resume, discard, session } =
    useStudySession();

  if (!active) {
    return (
      <div className="surface flex items-center gap-3 p-4">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-muted-foreground">
          <Timer className="h-5 w-5" />
        </span>
        <p className="text-sm text-muted-foreground">no session running.</p>
      </div>
    );
  }

  return (
    <div className="surface animate-fade-up flex flex-wrap items-center gap-3 p-4">
      <div className="flex min-w-[120px] flex-1 flex-col">
        <span className="font-heading text-[30px] font-black leading-none tabular-nums">{clock(elapsedSec)}</span>
        <span className="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-bold text-muted-foreground">
          <span className="flex items-center gap-1 text-brand">
            <Coins className="h-3 w-3" /> {coins} coins
          </span>
          {breakSec > 0 && (
            <span className="flex items-center gap-1">
              <Coffee className="h-3 w-3" /> {clock(breakSec)} break
            </span>
          )}
          <span className={cn('rounded-full px-2 py-0.5', isPaused ? 'bg-secondary' : 'bg-brand-soft text-brand-ink')}>
            {onBreak ? 'on a break' : isPaused ? 'paused' : 'counting'}
          </span>
        </span>
      </div>

      <div className="flex items-center gap-2">
        {isPaused ? (
          <Button
            size="sm"
            className="h-10 rounded-full px-4"
            onClick={() => resume()}
          >
            <Play className="mr-1.5 h-4 w-4" /> resume
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="h-10 rounded-full px-4"
            onClick={() => pause(false)}
          >
            <Pause className="mr-1.5 h-4 w-4" /> pause
          </Button>
        )}

        {onBreak ? (
          <Button size="sm" variant="outline" className="h-10 rounded-full px-4" onClick={() => resume()}>
            <Play className="mr-1.5 h-4 w-4" /> resume
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="h-10 rounded-full px-4"
            onClick={() => pause(true)}
            disabled={isPaused}
          >
            <Coffee className="mr-1.5 h-4 w-4" /> break
          </Button>
        )}

        <Button size="sm" className="h-10 rounded-full px-4" onClick={onFinish}>
          <Square className="mr-1.5 h-4 w-4" /> finish
        </Button>

        <Button
          size="icon"
          variant="ghost"
          className="h-10 w-10 rounded-full text-muted-foreground"
          aria-label="Bin this session"
          onClick={() => {
            if (window.confirm('bin this session? nothing is saved.')) discard();
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {session?.isFree && (
        <p className="w-full text-[11px] text-muted-foreground">free study · tag it when you finish.</p>
      )}
    </div>
  );
}