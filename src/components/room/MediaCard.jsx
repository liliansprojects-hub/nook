import { useState } from 'react';
import { ExternalLink, FileText, Film, Link2, Pencil, Trash2 } from 'lucide-react';
import { useSignedUrl } from '@/lib/files';
import { Image } from '@/components/ui/image';
import MediaViewer from '@/components/room/MediaViewer';
import WhiteboardPreview from '@/components/room/WhiteboardPreview';

// Every pin is the same small rectangle, so titles line up across the board.
// Photos and videos open full size when pressed.
export default function MediaCard({ item, onRemove }) {
  const signed = useSignedUrl(item.file_uri);
  const [open, setOpen] = useState(false);
  const isBoard = item.kind === 'whiteboard' && !!item.data;
  const isImage = item.kind === 'photo' || (item.kind === 'whiteboard' && !isBoard);
  const viewable = isBoard || ((isImage || item.kind === 'video') && !!signed);

  const removeButton = (
    <button
      type="button"
      onClick={() => onRemove(item)}
      aria-label="remove"
      className="absolute right-1.5 top-1.5 z-10 grid h-6 w-6 place-items-center rounded-full border border-border bg-card text-muted-foreground"
    >
      <Trash2 className="h-3 w-3" />
    </button>
  );

  // Links stay a small block of text — no page preview.
  if (item.kind === 'link') {
    return (
      <div className="surface group relative flex items-center gap-3 p-3.5">
        <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12.5px]">{item.title}</p>
          <p className="truncate text-[11px] text-muted-foreground">{item.url}</p>
        </div>
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          aria-label={`open ${item.title}`}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-brand"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
        {removeButton}
      </div>
    );
  }

  return (
    <div className="surface group relative overflow-hidden">
      <button
        type="button"
        onClick={() => viewable && setOpen(true)}
        aria-label={viewable ? `open ${item.title}` : item.title}
        className="block w-full"
      >
        <div className="aspect-[4/3] w-full overflow-hidden bg-secondary/40">
          {isBoard ? (
            <WhiteboardPreview data={item.data} className="h-full w-full" />
          ) : viewable ? (
            isImage ? (
              <Image src={signed} alt={item.title} fittingType="fill" className="h-full w-full" />
            ) : (
              <video src={signed} muted playsInline className="h-full w-full object-cover" />
            )
          ) : (
            <span className="grid h-full place-items-center text-muted-foreground">
              {item.kind === 'video' ? (
                <Film className="h-6 w-6" />
              ) : item.kind === 'whiteboard' ? (
                <Pencil className="h-6 w-6" />
              ) : (
                <FileText className="h-6 w-6" />
              )}
            </span>
          )}
        </div>
      </button>
      {removeButton}

      <div className="flex items-center gap-2 p-2">
        <p className="min-w-0 flex-1 truncate text-[11.5px]">{item.title}</p>
        {item.kind === 'document' && signed && (
          <a
            href={signed}
            target="_blank"
            rel="noreferrer"
            aria-label={`open ${item.title}`}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-secondary text-muted-foreground"
          >
            <FileText className="h-3.5 w-3.5" />
          </a>
        )}
      </div>

      <MediaViewer item={item} signedUrl={signed} open={open} onOpenChange={setOpen} />
    </div>
  );
}