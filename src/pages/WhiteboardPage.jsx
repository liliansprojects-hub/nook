import Whiteboard from '@/components/room/Whiteboard';

export default function WhiteboardPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-2xl">whiteboard</h1>
        <p className="mt-0.5 text-[12px] text-muted-foreground">draw and save.</p>
      </div>

      <div className="surface p-4">
        <Whiteboard roomId="" blockId="" />
      </div>
    </div>
  );
}