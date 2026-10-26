const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Check, Plus, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const COLOURS = {
  butter: '#FBEFC9',
  mint: '#D6EFE2',
  blush: '#FADCE3',
  sky: '#D8E8F7',
  lilac: '#E6DDF7',
};

export default function StickyLists({ roomId }) {
  const [lists, setLists] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [title, setTitle] = useState('');

  const load = async () => {
    try {
      const page = await db.entities.StickyList.filter(
        { room_id: roomId || '', deleted: { $ne: true } },
        { sort: '-created_date', limit: 30 }
      );
      setLists(page.items || []);
    } catch (err) {
      setLists([]);
    }
    setLoaded(true);
  };

  useEffect(() => {
    load();
  }, [roomId]);

  const createList = async (items = [], listTitle = title || 'New list') => {
    if (!listTitle.trim()) return;
    const created = await db.entities.StickyList.create({
      title: listTitle,
      room_id: roomId || '',
      colour: Object.keys(COLOURS)[lists.length % 5],
      items,
    });
    setLists((prev) => [created, ...prev]);
    setTitle('');
  };

  const update = (list) => {
    setLists((prev) => prev.map((l) => (l.id === list.id ? list : l)));
    db.entities.StickyList.update(list.id, { items: list.items }).catch(() => {});
  };

  const toggleItem = (list, item) => {
    update({ ...list, items: list.items.map((i) => (i.id === item.id ? { ...i, done: !i.done } : i)) });
  };

  const addItem = (list, text) => {
    if (!text.trim()) return;
    update({ ...list, items: [...(list.items || []), { id: crypto.randomUUID(), text, done: false }] });
  };

  const removeList = async (list) => {
    setLists((prev) => prev.filter((l) => l.id !== list.id));
    await db.entities.StickyList.update(list.id, { deleted: true });
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h3 className="mr-auto font-heading text-sm font-extrabold">Sticky lists</h3>
        <div className="flex items-center gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="New list name"
            className="h-9 w-40 rounded-full border border-input bg-card px-3 text-[12px] font-bold outline-none focus:border-brand"
          />
          <Button size="sm" className="h-9 rounded-full px-3 font-medium" onClick={() => createList()}>
            <Plus className="mr-1 h-3.5 w-3.5" /> List
          </Button>
        </div>
      </div>

      {lists.length === 0 ? (
        <div className="rounded-[1.5rem] border-2 border-dashed border-border p-8 text-center text-[12px] font-bold text-muted-foreground">
          No sticky lists in here yet.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {lists.map((list) => (
            <div
              key={list.id}
              className="rounded-[1.4rem] p-4 shadow-soft"
              style={{ background: COLOURS[list.colour] || COLOURS.butter }}
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <h4 className="font-heading text-[14px] font-black text-foreground/80">{list.title}</h4>
                <button
                  type="button"
                  aria-label="Delete list"
                  onClick={() => removeList(list)}
                  className="grid h-7 w-7 place-items-center rounded-full bg-white/50 text-foreground/60"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              <ul className="space-y-1.5">
                {(list.items || []).map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => toggleItem(list, item)}
                      className="flex w-full items-start gap-2 text-left"
                    >
                      <span
                        className={cn(
                          'mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border-2',
                          item.done ? 'border-foreground/40 bg-foreground/40 text-white' : 'border-foreground/30'
                        )}
                      >
                        {item.done && <Check className="h-2.5 w-2.5" />}
                      </span>
                      <span
                        className={cn(
                          'text-[13px] font-bold text-foreground/80',
                          item.done && 'text-foreground/40 line-through decoration-2'
                        )}
                      >
                        {item.text}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>

              <NewItemInput onAdd={(text) => addItem(list, text)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NewItemInput({ onAdd }) {
  const [value, setValue] = useState('');
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2.5 flex items-center gap-1 text-[11px] font-extrabold text-foreground/50"
      >
        <Plus className="h-3 w-3" /> Add a line
      </button>
    );
  }

  return (
    <form
      className="mt-2.5 flex items-center gap-1.5"
      onSubmit={(e) => {
        e.preventDefault();
        onAdd(value);
        setValue('');
      }}
    >
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Write it down…"
        className="h-8 flex-1 rounded-full border-0 bg-white/60 px-3 text-[12px] font-bold outline-none"
      />
      <button type="submit" className="grid h-8 w-8 place-items-center rounded-full bg-white/70">
        <Check className="h-3.5 w-3.5" />
      </button>
      <button type="button" onClick={() => setOpen(false)} className="grid h-8 w-8 place-items-center rounded-full bg-white/40">
        <X className="h-3.5 w-3.5" />
      </button>
    </form>
  );
}