'use client';

import { useActionState } from 'react';
import { joinWaitlist } from '@/lib/actions/waitlist';

const INITIAL = { ok: false, message: '' };

export default function WaitlistForm() {
  const [state, formAction, pending] = useActionState(joinWaitlist, INITIAL);

  return (
    <>
      <form action={formAction} className="waitlist-form">
        <input
          type="email"
          name="email"
          placeholder="your email"
          required
          disabled={state.ok}
          aria-label="Email address"
        />
        <button type="submit" disabled={pending || state.ok}>
          {state.ok ? "thanks, you're in" : pending ? 'joining...' : 'Join waitlist'}
        </button>
      </form>
      {state.message && (
        <p className={`cta-status ${state.ok ? 'ok' : 'err'}`}>{state.message}</p>
      )}
    </>
  );
}
