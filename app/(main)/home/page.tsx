import GlintCapture from '@/components/home/glint-capture';
import { getActivityStrip, getStreak, getUserTimezone } from '@/lib/queries/activity';

// Slice-0 Home: the daily glint capture, the streak, the activity strip, and the
// connection chips. Behind the (main) layout, so it is auth-gated and phone-framed.
// The Daily Review is deliberately absent (there is no such surface, per docs/MAGPIE_2.md).
export default async function HomePage() {
  const tz = await getUserTimezone();
  const [streak, strip] = await Promise.all([getStreak(tz), getActivityStrip(tz)]);

  return (
    <div className="space-y-6 pt-2">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Today</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">catch a glint. watch it connect.</p>
      </header>
      <GlintCapture initialStreak={streak} initialStrip={strip} />
    </div>
  );
}
