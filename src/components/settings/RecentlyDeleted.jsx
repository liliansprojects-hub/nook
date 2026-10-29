import { base44 } from '@/api/base44Client';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Check, RotateCcw, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { dayLabel } from '@/lib/format';

const SOURCES = [
  { entity: 'StudySession', label: 'Session', title: (r) => r.room_name || 'Session' },
  { entity: 'MediaItem', label: 'Media', title: (r) => r.title },
  { entity: 'StickyList', label: 'Sticky list', title: (r) => r.title },
  { entity: 'Block', label: 'Block', title: (r) => r.title },
  { entity: 'StudyRoom', label: 'Room', title: (r) => r.name },
  { entity: 'Purchase', label: 'Café order', title: (r) => r.item_name },
];

export default function RecentlyDeleted() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const results = await Promise.all(
      SOURCES.map(async (source) => {
        try {
          const page = await base44.entities[source.entity].filter(
            { deleted: true },
            { sort: '-updated_date', limit: 20 }
          );
          return (page.items || []).map((r) => ({
            id: r.id,
            entity: source.entity,
            label: source.label,
            title: source.title(r) || source.label,
            when: r.updated_date,
          }));
        } catch (err) {
          return [];
        }
      })
    );
    const flat = results.flat().sort((a, b) => new Date(b.when) - new Date(a.when));
    setItems(flat);
    setSelected([]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const restore = async () => {
    const byEntity = {};
    selected.forEach((id) => {
      const item = items.find((i) => i.id === id);
      if (!item) return;
      byEntity[item.entity] = byEntity[item.entity] || [];
      byEntity[item.entity].push({ id, deleted: false });
    });
    await Promise.all(Object.entries(byEntity).map(([entity, recs]) => base44.entities[entity].bulkUpdate(recs)));
    load();
  };

  const wipe = async (ids) => {
    const byEntity = {};
    ids.forEach((id) => {
      const item = items.find((i) => i.id === id);
      if (!item) return;
      byEntity[item.entity] = byEntity[item.entity] || [];
      byEntity[item.entity].push(id);
    });
    await Promise.all(
      Object.entries(byEntity).map(([entity, entityIds]) =>
        Promise.all(entityIds.map((id) => base44.entities[entity].delete(id)))
      )
    );
    load();
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[12px] font-bold text-muted-foreground">
          Everything you delete lands here — including media links and café orders.
        </p>
        {selected.length > 0 && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="h-9 rounded-full font-extrabold" onClick={restore}>
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Restore
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-9 rounded-full font-extrabold text-destructive"
              onClick={() => {
                if (window.confirm(`Delete ${selected.length} item(s) for good?`)) wipe(selected);
              }}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete for good
            </Button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="h-24 animate-pulse rounded-[1.5rem] bg-secondary/70" />
      ) : items.length === 0 ? (
        <div className="rounded-[1.5rem] border-2 border-dashed border-border p-8 text-center text-[12px] font-bold text-muted-foreground">
          Nothing in the bin.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <button
              key={`${item.entity}-${item.id}`}
              type="button"
              onClick={() =>
                setSelected((prev) => (prev.includes(item.id) ? prev.filter((i) => i !== item.id) : [...prev, item.id]))
              }
              className={cn(
                'flex w-full items-center gap-3 rounded-[1.2rem] bg-secondary/60 p-3 text-left',
                selected.includes(item.id) && 'ring-2 ring-brand'
              )}
            >
              <span
                className={cn(
                  'grid h-6 w-6 shrink-0 place-items-center rounded-full border-2',
                  selected.includes(item.id) ? 'border-brand bg-brand text-brand-foreground' : 'border-border'
                )}
              >
                {selected.includes(item.id) && <Check className="h-3.5 w-3.5" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-extrabold">{item.title}</span>
                <span className="text-[11px] font-bold text-muted-foreground">
                  {item.label} · {dayLabel(item.when)}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}