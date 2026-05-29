import type { User } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import AppBar from '@/components/nav/app-bar';
import BottomTabBar from '@/components/nav/bottom-tab-bar';
import { createClient } from '@/lib/supabase/server';

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  let user: User | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // Supabase unreachable (e.g. pre-creds boot). Fall through to redirect.
  }
  if (!user) redirect('/login');

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <AppBar />
      <main className="flex-1 px-4 pb-24 pt-2">{children}</main>
      <BottomTabBar />
    </div>
  );
}
