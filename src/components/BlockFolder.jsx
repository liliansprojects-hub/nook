import { useState } from 'react';
import { Check, ChevronDown, ChevronRight } from 'lucide-react';
import { kindOf, formatDue } from '@/lib/blocks';
import BlockMenu from '@/components/BlockMenu';
import AddInsideButton from '@/components/AddInsideButton';
import { cn } from '@/lib/utils';

// A block that holds things inside it reads like a folder: a heading you can
// fold away with its items underneath. Inside a course or project it reads as a
// subheading in the accent ink, so a unit never looks like just another row.
export default function BlockFolder({ block, blocks, onOpen, onToggle, onChanged, depth = 0 }) {
  const [open, setOpen] = useState(true);
  const kind = kindOf(block.kind);
  const Icon = kind.icon;
  const children = blocks.filter((b) => b.parent_id === block.id);
  const due = formatDue(block.due_date);
  const sub = depth > 0;

  return (
    <div className="animate-fade-up">
      <div className={cn('flex items-center gap-2.5', sub ? 'ml-1 border-l-2 border-brand-soft py-1 pl-3' : 'surface p-2.5 pr-3')}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? 'fold away' : 'open folder'}
          className={cn(
            'grid shrink-0 place-items-center rounded-full text-muted-foreground',
            sub ? 'h-6 w-6' : 'h-7 w-7'
          )}
        >
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>

        <button type="button" onClick={() => onOpen?.(block)} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
          <Icon className={cn('shrink-0 text-brand', sub ? 'h-4 w-4' : 'h-[18px] w-[18px]')} />
          <span className={cn('min-w-0 flex-1 truncate font-heading', sub ? 'text-[14px] text-brand-ink' : 'text-[15px]', block.done && 'line-through')}>
            {block.title}
          </span>
          {!sub && <span className="pill shrink-0 bg-secondary text-muted-foreground">{kind.label}</span>}
        </button>

        {due && <span className="shrink-0 text-[11px] text-muted-foreground">{due}</span>}

        {block.kind === 'task' ? (
          <button
            type="button"
            onClick={() => onToggle?.(block)}
            aria-label="mark done"
            className={cn(
              'grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 transition-colors',
              block.done ? 'border-brand bg-brand text-brand-on' : 'border-border text-transparent hover:border-brand'
            )}
          >
            <Check className="h-3.5 w-3.5" />
          </button>
        ) : (
          <>
            <AddInsideButton block={block} onChanged={onChanged} />
            <BlockMenu block={block} blocks={blocks} onChanged={onChanged} />
          </>
        )}
      </div>

      {open && (
        <div className="mt-1 space-y-1">
          {children.length === 0 ? (
            <p className="ml-9 py-1 text-[11px] text-muted-foreground">empty</p>
          ) : (
            children.map((child) =>
              blocks.some((b) => b.parent_id === child.id) ? (
                <BlockFolder
                  key={child.id}
                  block={child}
                  blocks={blocks}
                  onOpen={onOpen}
                  onToggle={onToggle}
                  onChanged={onChanged}
                  depth={depth + 1}
                />
              ) : (
                <LeafRow key={child.id} block={child} blocks={blocks} onOpen={onOpen} onToggle={onToggle} onChanged={onChanged} />
              )
            )
          )}
        </div>
      )}
    </div>
  );
}

function LeafRow({ block, blocks = [], onOpen, onToggle, onChanged }) {
  const kind = kindOf(block.kind);
  const Icon = kind.icon;
  const due = formatDue(block.due_date);
  return (
    <div className={cn('ml-9 flex items-center gap-2.5 py-1', block.done && 'opacity-55')}>
      <button type="button" onClick={() => onOpen?.(block)} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
        <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className={cn('min-w-0 flex-1 truncate text-[12.5px] text-muted-foreground', block.done && 'line-through')}>{block.title}</span>
      </button>
      {due && <span className="shrink-0 text-[11px] text-muted-foreground">{due}</span>}
      {block.kind === 'task' ? (
        <button
          type="button"
          onClick={() => onToggle?.(block)}
          aria-label="mark done"
          className={cn(
            'grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition-colors',
            block.done ? 'border-brand bg-brand text-brand-on' : 'border-border text-transparent hover:border-brand'
          )}
        >
          <Check className="h-3 w-3" />
        </button>
      ) : (
        <>
          <AddInsideButton block={block} onChanged={onChanged} />
          <BlockMenu block={block} blocks={blocks} onChanged={onChanged} />
        </>
      )}
      <span className="sr-only">{kind.label}</span>
    </div>
  );
}