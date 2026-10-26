import { Image } from '@/components/ui/image';
import { cn } from '@/lib/utils';
import { PHOTOS } from '@/lib/cafeArt';

// The photo of the item, shot on white — multiply blending drops the white away
// so it sits on whatever surface it is placed on. The reflection doubles it
// under itself, which is what makes a glass read as standing on the desk.
export default function ItemArt({ item, className, blend = true, remaining = 100, reflection = false, levelStyle = { background: 'rgba(255,255,255,0.45)' } }) {
  const src = item ? PHOTOS[item.id] || item.art : null;
  if (!src) return null;
  const level = Math.max(0, Math.min(100, remaining));
  const style = blend ? { mixBlendMode: 'multiply' } : undefined;
  const fade = 'linear-gradient(to top, transparent 15%, black)';

  return (
    <div className={cn('relative', className)}>
      <Image
        src={src}
        alt={item.name}
        fittingType="fit"
        className="h-full w-full object-contain"
        style={style}
        data-item-art={item.id}
      />
      {reflection && (
        <div
          className="pointer-events-none absolute inset-x-0 top-full h-1/2 -scale-y-100 opacity-20"
          style={{ maskImage: fade, WebkitMaskImage: fade }}
        >
          <Image src={src} alt="" fittingType="fit" className="h-full w-full object-contain" style={style} />
        </div>
      )}
      {level < 100 && (
        <span
          className="pointer-events-none absolute inset-0"
          style={{
            ...levelStyle,
            clipPath: item.kind === 'pastry' ? `inset(0 ${level}% 0 0)` : `inset(0 0 ${level}% 0)`,
          }}
        />
      )}
    </div>
  );
}