const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import MediaCard from '@/components/room/MediaCard';
import UploadMediaDialog from '@/components/media/UploadMediaDialog';
import { useCached } from '@/lib/offline';

export default function IdeaBoard({ roomId, blockId }) {
  const [adding, setAdding] = useState(false);
  const [items, setItems] = useState([]);

  const { data, reload } = useCached(
    `nook.board.${roomId || 'free'}`,
    async () => {
      const page = await db.entities.MediaItem.filter(
        { room_id: roomId || '', deleted: { $ne: true } },
        { sort: '-created_date', limit: 60 }
      );
      return page.items || [];
    },
    [roomId]
  );

  useEffect(() => {
    setItems(Array.isArray(data) ? data : []);
  }, [data]);

  const remove = async (item) => {
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    await db.entities.MediaItem.update(item.id, { deleted: true });
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="font-heading text-sm">idea board</h3>
          <p className="text-[11px] text-muted-foreground">pins</p>
        </div>
        <Button size="sm" className="h-9 rounded-full px-3.5" onClick={() => setAdding(true)}>
          <Plus className="mr-1 h-4 w-4" /> add
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-[1.5rem] border-2 border-dashed border-border p-8 text-center text-[12px] text-muted-foreground">
          nothing pinned yet.
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-6">
          {items.map((item) => (
            <MediaCard key={item.id} item={item} onRemove={remove} />
          ))}
        </div>
      )}

      <UploadMediaDialog
        open={adding}
        onOpenChange={setAdding}
        roomId={roomId}
        blockId={blockId}
        onSaved={reload}
      />
    </div>
  );
}