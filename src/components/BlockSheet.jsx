const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Check, Pencil, Play, Plus, Trash2 } from 'lucide-react';
import { kindOf, formatDue } from '@/lib/blocks';
import { startSession, setPendingTag } from '@/lib/useStudySession';
import BlockDialog from '@/components/BlockDialog';
import { cn } from '@/lib/utils';

export default function BlockSheet({ open, onOpenChange, block, children = [], onChanged }) {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(null);

  if (!block) return null;
  const meta = kindOf(block.kind);
  const Icon = meta.icon;
  const due = formatDue(block.due_date);

  const toggle = async (item) => {
    await db.entities.Block.update(item.id, { done: !item.done });
    onChanged?.();
  };

  const toggleSelf = async () => {
    await db.entities.Block.update(block.id, { done: !block.done });
    onChanged?.();
  };

  const isTask = block.kind === 'task';

  const remove = async () => {
    await db.entities.Block.update(block.id, { deleted: true });
    for (const child of children) await db.entities.Block.update(child.id, { deleted: true });
    onOpenChange(false);
    onChanged?.();
  };

  const studyNow = () => {
    setPendingTag({ id: block.id, label: block.title });
    startSession(null);
    onOpenChange(false);
    navigate('/room/free');
  };

  return (
    <>
      <Dialog open={open && !editing && !adding} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md rounded-[1.8rem]">
          <DialogHeader>
            <div className="flex items-start gap-3">
              <span
                className="grid h-11 w-11 shrink-0 place-items-center rounded-[1rem]"
                style={{ background: meta.tint, color: meta.accent }}
              >
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1 text-left">
                <DialogTitle className="font-heading text-lg font-black">{block.title}</DialogTitle>
                <p className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] font-bold text-muted-foreground">
                  <span className="pill" style={{ background: meta.tint, color: meta.accent }}>
                    {meta.label}
                  </span>
                  {due && <span className="pill bg-secondary">{due}</span>}
                  {block.done && <span className="pill bg-secondary">done</span>}
                </p>
              </div>
              {isTask && (
                <button
                  type="button"
                  onClick={toggleSelf}
                  aria-label="mark done"
                  className={cn(
                    'grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 transition-colors',
                    block.done ? 'border-brand bg-brand text-brand-foreground' : 'border-border text-transparent hover:border-brand'
                  )}
                >
                  <Check className="h-4 w-4" />
                </button>
              )}
            </div>
          </DialogHeader>

          {block.notes && (
            <p className="rounded-[1.2rem] bg-secondary/70 p-3 text-[13px] font-semibold">{block.notes}</p>
          )}

          <div className="space-y-2">
            <p className="text-[11px] tracking-[0.14em] text-muted-foreground">inside</p>
            {children.length === 0 ? (
              <p className="text-[12px] text-muted-foreground">empty</p>
            ) : (
              children.map((child) => {
                const childMeta = kindOf(child.kind);
                const ChildIcon = childMeta.icon;
                return (
                  <div
                    key={child.id}
                    className={cn(
                      'flex items-center gap-2.5 rounded-[1.1rem] bg-secondary/60 p-2.5',
                      child.done && 'opacity-55'
                    )}
                  >
                    <span
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-[0.7rem]"
                      style={{ background: childMeta.tint, color: childMeta.accent }}
                    >
                      <ChildIcon className="h-4 w-4" />
                    </span>
                    <span className={cn('min-w-0 flex-1 truncate text-[13px] font-extrabold', child.done && 'line-through')}>
                      {child.title}
                    </span>
                    {child.due_date && (
                      <span className="pill bg-card text-muted-foreground">{formatDue(child.due_date)}</span>
                    )}
                    <button
                      type="button"
                      onClick={() => toggle(child)}
                      aria-label="Mark done"
                      className={cn(
                        'grid h-7 w-7 shrink-0 place-items-center rounded-full border-2',
                        child.done ? 'border-brand bg-brand text-brand-foreground' : 'border-border text-transparent'
                      )}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })
            )}

            {meta.children.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {meta.children.map((childKind) => {
                  const childMeta = kindOf(childKind);
                  const ChildIcon = childMeta.icon;
                  return (
                    <button
                      key={childKind}
                      type="button"
                      onClick={() => setAdding(childKind)}
                      className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-extrabold"
                      style={{ background: childMeta.tint, color: childMeta.accent }}
                    >
                      <Plus className="h-3 w-3" />
                      <ChildIcon className="h-3.5 w-3.5" />
                      {childMeta.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button className="h-11 flex-1 rounded-full" onClick={studyNow}>
              <Play className="mr-1.5 h-4 w-4" /> study now
            </Button>
            {!isTask && (
              <Button variant="outline" className="h-11 rounded-full px-4" onClick={toggleSelf}>
                <Check className="mr-1.5 h-4 w-4" /> {block.done ? 'reopen' : 'done'}
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-11 w-11 rounded-full" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 rounded-full text-destructive"
              onClick={() => {
                if (window.confirm(`delete ${block.title}? you can restore it in settings.`)) remove();
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BlockDialog
        open={editing}
        onOpenChange={setEditing}
        block={block}
        onSaved={() => {
          setEditing(false);
          onChanged?.();
        }}
      />

      <BlockDialog
        open={!!adding}
        onOpenChange={() => setAdding(null)}
        kind={adding || 'task'}
        parent={block}
        onSaved={() => {
          setAdding(null);
          onChanged?.();
        }}
      />
    </>
  );
}