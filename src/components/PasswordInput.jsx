import React, { useState } from 'react';
import { Check, Eye, EyeOff, Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// small green circle with a tick: "this is right"
export function ValidTick({ className }) {
  return (
    <span className={cn('grid h-5 w-5 shrink-0 place-items-center rounded-full bg-green-500 text-white', className)} aria-label="looks good">
      <Check className="h-3 w-3" strokeWidth={3} />
    </span>
  );
}

// Password box with an eye to show what you typed, and an optional green tick.
export default function PasswordInput({ valid = false, icon = true, className, ...props }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      {icon && <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />}
      <Input
        {...props}
        type={show ? 'text' : 'password'}
        className={cn('h-12', icon && 'pl-10', valid ? 'pr-20' : 'pr-11', className)}
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
        {valid && <ValidTick />}
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? 'hide password' : 'show password'}
          aria-pressed={show}
          className="text-muted-foreground hover:text-foreground"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
