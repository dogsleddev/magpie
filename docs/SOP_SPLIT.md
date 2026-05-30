# Magpie · SOP: Get to the Hackathon Split

**Purpose:** tonight's runbook. Take the build from "Phase 5 committed, local repo" to "tested, deployed base on magpie.wiki, with a `hackathon` branch live at hackathon.magpie.wiki." **Stop at the split.** Krava and Linq are the next session.

**Time:** ~2.5 to 3.5 hours. Deploy + magic-link auth is the unpredictable part. If it eats the whole night, that is still the win: a tested, deployed, multi-user base is worth more than half-built features.

**Ground truth right now:**
- Branch `master`, Phase 5 committed (`e2ab12d`), working tree clean.
- Repo is LOCAL ONLY (no GitHub remote yet). Pushing is the first deploy step.
- Anthropic credits funded; all five AI modes verified live.
- magpie.wiki owned with editable DNS. GitHub (`dogsleddev`) + Vercel ready.

**Done when (the split is nailed):**
- [ ] magpie.wiki serves the app over HTTPS.
- [ ] Magic-link sign-up works on the live domain (a fresh email can sign up and land on the grid).
- [ ] A second user sees only their own data (RLS holds in prod).
- [ ] `hackathon` branch exists, pushed, and deploys to hackathon.magpie.wiki.
- [ ] `master` has zero Krava/Linq code.

---

## Step 0 - Pre-flight (5 min)
- Open tabs: GitHub (`dogsleddev`), Vercel, Supabase dashboard, magpie.wiki registrar DNS.
- Confirm clean state:
  ```powershell
  git status   # nothing to commit, on master
  ```

## Step 1 - Close the Level 1 identity seam (~30 min, Claude drives)
Base-app plumbing so the AI layer carries the authenticated user id. This is NOT Krava code (no Krava import); it just makes `master` Krava-ready so tomorrow is a one-file swap with zero route edits.

Edits:
1. `lib/ai/client.ts` → add to `CallClaudeArgs`:
   ```ts
   userId?: string; // carried for per-user privacy routing; Krava reads it on the hackathon branch, direct Anthropic ignores it
   ```
2. `lib/ai/text-mode.ts` → `import { requireUser } from '@/lib/supabase/server';`, then inside `handleTextMode`: `const { id: userId } = await requireUser();` and pass `userId` into the `callClaude({ ... })` args.
3. `app/api/ai/organize/route.ts` → same: import `requireUser`, get `userId`, pass to `callClaude`.
4. `app/api/ai/convo/route.ts` → same: get `userId`, pass to `streamClaude`.

Verify, then commit:
```powershell
npm run type-check
Remove-Item -Recurse -Force .next; npm run build
git add -A; git commit -m "feat: thread userId through the AI layer (krava-ready)"
```

## Step 2 - Test pass (~45 min)
Run `npm run dev`, drive at 375px in Chrome or Edge. Automated gates first:
- [ ] `npm run type-check` clean.
- [ ] `Remove-Item -Recurse -Force .next; npm run build` clean. (Clear `.next` first; OneDrive corrupts stale build artifacts, and a prod `.next` makes `next dev` crash on start.)

**Auth (the untested cliff, do this carefully):**
- [ ] Logged out, `/` and `/topic/...` redirect to `/login`.
- [ ] Magic link end to end on localhost: enter email, receive it, click the link, land authenticated. If broken, it is the Supabase Auth URL config (fix in Step 4 before relying on it).
- [ ] Dev password sign-in works. Session survives a hard refresh.

**Capture (Phase 4):**
- [ ] Add via Enter and the + button, reload, persists. Edit (Enter and blur) persists. Delete persists. Timer start/pause/reset.
- [ ] Mic (Chrome/Edge): permission prompt, live transcription, mic-stop saves the bullet.
- [ ] Organize at 3+ bullets, real buckets render, learn_more lands in Discover.

**AI modes (Phase 5), on a topic with thoughts and one without:**
- [ ] Brief / Challenge / Questions load, render correctly, Reroll changes content, revisit is instant (cached).
- [ ] Convo: opener shows, send streams, reload preserves the thread, multi-turn keeps context.

**Cross-cutting + privacy:**
- [ ] DevTools Network during AI calls: requests go to `/api/ai/*` only, nothing to `api.anthropic.com` from the browser, no key in any client bundle.
- [ ] RLS: a SECOND user sees none of the first user's data.
- [ ] Zero console errors. 375px: no horizontal scroll, comfortable touch targets, bottom tab clears the safe area.

## Step 3 - Fix anything Step 2 surfaced, then commit.

## Step 4 - Deploy master to magpie.wiki (~60 to 90 min)
You do the dashboard clicks; Claude can draft configs and drive parts of Vercel via the integration.

1. **Push to GitHub:**
   ```powershell
   gh repo create dogsleddev/magpie --private --source=. --remote=origin
   git push -u origin master
   ```
   (Or create the repo on github.com, then `git remote add origin https://github.com/dogsleddev/magpie.git; git push -u origin master`.)
2. **Vercel:** New Project, import `dogsleddev/magpie`, framework auto-detects Next.js. Add env vars (copy values from `.env.local`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `ANTHROPIC_API_KEY`
   (`SUPABASE_PROJECT_ID` is only used by the local `db:types` script, not needed in Vercel.) Deploy, confirm the `*.vercel.app` URL boots.
3. **Domain:** Vercel → Project → Settings → Domains → add `magpie.wiki`. Follow Vercel's DNS instructions at your registrar (apex A record or nameservers). Wait for "Valid Configuration."
4. **Supabase Auth URLs** (Dashboard → Authentication → URL Configuration):
   - Site URL: `https://magpie.wiki`
   - Redirect URLs (add all three): `https://magpie.wiki/auth/callback`, `https://hackathon.magpie.wiki/auth/callback`, `http://localhost:3000/auth/callback`
5. **Verify in prod (the moment that matters):**
   - [ ] https://magpie.wiki loads over HTTPS.
   - [ ] Magic-link sign-up with a real email works end to end on the live domain.
   - [ ] A fresh user seeds the starter pack, all four AI modes work, and RLS isolates them from your main account.

## Step 5 - Nail the split (~20 min)
1. Confirm `master` is the deployed, green commit.
2. Branch and push:
   ```powershell
   git checkout -b hackathon
   git push -u origin hackathon
   git checkout master
   ```
3. Vercel → Settings → Domains → add `hackathon.magpie.wiki` → assign it to the `hackathon` git branch. Add the CNAME at your registrar per Vercel's instructions.
4. **Smoke-test base functionality on hackathon.magpie.wiki** (the only check needed; the branch is identical code to master tonight): sign in, add a thought to a topic, and send one Convo message and get a reply. If those two work, the hackathon front door is good.
   - Note: both domains hit the same Supabase project, so this writes to the same DB as magpie.wiki (expected). Data is isolated per user, not per domain.
5. `master` stays clean. End of night, main and hackathon are identical code, different domain. All Krava/Linq work happens on `hackathon` next session.

## Optional polish (only if time remains)
Kill the dead-ends a judge would hit: the disabled "Add topic" button and the dead Facets/Discover/Journal bottom tabs. Cheapest win is to hide them; or build Phase 6 facets (quick, AI-free). Redeploy.

## STOP HERE
The split is nailed. Update PROGRESS.md (flip status + session log), commit, then start a fresh session for the hackathon using `docs/HACKATHON_KRAVA_LINQ.md` (read the "locked decisions" section at the bottom first).
