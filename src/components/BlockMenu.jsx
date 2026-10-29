import { base44 } from '@/api/base44Client';
import { useState } from 'react';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CornerUpLeft, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { canHold, kindOf } from '@/lib/blocks';
import BlockDialog from '@/components/BlockDialog';
import { cn } from '@/lib/utils';

// A task keeps its tick on the row; anything that holds other things gets these
// three dots instead: edit it, move it in or out of a block, or delete it.
export default function BlockMenu({ block, blocks = [], onChanged }) {
  const [editing, setEditing] = useState(false);
  const [moving, setMoving] = useState(false);

  // the block itself and everything living inside it — never a move target
  const family = (() => {
    const out = new Set([block.id]);
    let grew = true;
    while (grew) {
      grew = false;
      blocks.forEach((b) => {
        if (b.parent_id && out.has(b.parent_id) && !out.has(b.id)) {
          out.add(b.id);
          grew = true;
        }
      });
    }
    return out;
  })();

  const parents = blocks.filter((b) => !family.has(b.id) && canHold(b.kind, block.kind));
  const current = blocks.find((b) => b.id === block.parent_id);

  const move = async (parentId) => {
    await base44.entities.Block.update(block.id, { parent_id: parentId });
    setMoving(false);
    onChanged?.();
  };

  const remove = async () => {
    if (!window.confirm(`delete ${block.title}? you can restore it in settings.`)) return;
    await base44.entities.Block.updateMany({ id: { $in: [...family] } }, { $set: { deleted: true } });
    onChanged?.();
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={`options for ${block.title}`}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px] rounded-[1.4rem] p-1.5">
          <DropdownMenuItem onSelect={() => setEditing(true)} className="gap-2 text-[13px] font-bold">
            <Pencil className="h-3.5 w-3.5" /> edit details
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setMoving(true)} className="gap-2 text-[13px] font-bold">
            <CornerUpLeft className="h-3.5 w-3.5" /> move
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={remove} className="gap-2 text-[13px] font-bold text-destructive">
            <Trash2 className="h-3.5 w-3.5" /> delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <BlockDialog
        open={editing}
        onOpenChange={setEditing}
        block={block}
        onSaved={() => {
          setEditing(false);
          onChanged?.();
        }}
      />

      <Dialog open={moving} onOpenChange={setMoving}>
        <DialogContent className="max-h-[85vh] max-w-sm overflow-y-auto rounded-[1.8rem]">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg font-black">move {block.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => move('')}
              className={cn(
                'flex w-full items-center justify-between rounded-[1.1rem] px-3.5 py-2.5 text-left text-[13px] font-bold',
                !current ? 'bg-brand-soft text-brand-ink' : 'bg-secondary/60'
              )}
            >
              top level
              {!current && <span className="text-[11px]">here</span>}
            </button>

            {parents.length === 0 ? (
              <p className="px-1 text-[12px] text-muted-foreground">no block can hold this one.</p>
            ) : (
              parents.map((parent) => {
                const meta = kindOf(parent.kind);
                const Icon = meta.icon;
                const isHere = parent.id === block.parent_id;
                return (
                  <button
                    key={parent.id}
                    type="button"
                    onClick={() => move(parent.id)}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-[1.1rem] px-3 py-2.5 text-left text-[13px] font-bold',
                      isHere ? 'bg-brand-soft text-brand-ink' : 'bg-secondary/60'
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="min-w-0 flex-1 truncate">{parent.title}</span>
                    <span className="shrink-0 text-[10px] text-muted-foreground">{meta.label}</span>
                  </button>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}