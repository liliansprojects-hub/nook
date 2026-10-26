import { useState } from 'react';
import { Plus } from 'lucide-react';
import BlockDialog from '@/components/BlockDialog';
import { kindOf } from '@/lib/blocks';

// Sits beside the three dots on anything that can hold other blocks, so
// something can be dropped straight inside it from the list.
export default function AddInsideButton({ block, onChanged }) {
  const [open, setOpen] = useState(false);
  const inner = kindOf(block.kind).children || [];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`add inside ${block.title}`}
        className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-soft text-brand-ink transition-colors hover:bg-brand hover:text-brand-on"
      >
        <Plus className="h-4 w-4" />
      </button>

      <BlockDialog
        open={open}
        onOpenChange={setOpen}
        kind={inner[0] || 'task'}
        parent={block}
        onSaved={() => {
          setOpen(false);
          onChanged?.();
        }}
      />
    </>
  );
}