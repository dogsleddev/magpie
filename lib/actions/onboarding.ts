'use server';

import { revalidatePath } from 'next/cache';
import { seedStarterTopics, type SeedResult } from './seed-starter-topics';

export async function loadStarterPack(): Promise<SeedResult> {
  const result = await seedStarterTopics();
  revalidatePath('/');
  return result;
}
