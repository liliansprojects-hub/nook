import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Image } from '@/components/ui/image';
import WhiteboardPreview from '@/components/room/WhiteboardPreview';

// Press a photo or video and it opens full size, at its own shape, untouched.
export default function MediaViewer({ item, signedUrl, open, onOpenChange }) {
  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-5xl overflow-hidden rounded-[1.9rem] border-0 p-3">
        <div className="grid max-h-[80vh] place-items-center overflow-auto">
          {item.kind === 'whiteboard' && item.data ? (
            <WhiteboardPreview
              data={item.data}
              className="h-[70vh] w-full rounded-[1.4rem] border border-border/70"
            />
          ) : item.kind === 'video' ? (
            <video src={signedUrl} controls autoPlay playsInline className="max-h-[80vh] max-w-full rounded-[1.4rem]" />
          ) : (
            <Image src={signedUrl} alt={item.title} fittingType="fit" className="max-h-[80vh] w-auto max-w-full" />
          )}
        </div>
        <p className="truncate px-1 text-[12px] text-muted-foreground">{item.title}</p>
      </DialogContent>
    </Dialog>
  );
}