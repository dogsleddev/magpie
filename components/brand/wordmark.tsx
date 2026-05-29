import Image from 'next/image';
import { cn } from '@/lib/utils';

type WordmarkProps = {
  className?: string;
  showText?: boolean;
  size?: number;
};

export default function Wordmark({ className, showText = true, size = 28 }: WordmarkProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Image src="/brand/magpie-mark-small.png" alt="Magpie" width={size} height={size} priority />
      {showText && (
        <span className="font-display text-xl font-semibold tracking-tight text-text">Magpie</span>
      )}
    </div>
  );
}
