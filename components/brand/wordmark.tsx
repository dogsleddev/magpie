import Image from 'next/image';
import { cn } from '@/lib/utils';

type WordmarkProps = {
  className?: string;
  showText?: boolean;
  showDot?: boolean;
  size?: number; // rendered mark height in px
};

// Intrinsic dimensions of public/brand/magpie-mark.png (416x349).
const MARK_RATIO = 416 / 349;

export default function Wordmark({
  className,
  showText = true,
  showDot = true,
  size = 40,
}: WordmarkProps) {
  const width = Math.round(size * MARK_RATIO);
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <Image
        src="/brand/magpie-mark.png"
        alt={showText ? '' : 'Magpie'}
        width={416}
        height={349}
        priority
        className="rounded-md"
        style={{ height: size, width }}
      />
      {showText && (
        <span className="font-display text-xl font-semibold tracking-tight text-text">
          Magpie
          {showDot && (
            <span
              aria-hidden
              className="ml-1 inline-block h-2 w-2 rounded-full bg-teal align-middle"
            />
          )}
        </span>
      )}
    </div>
  );
}
