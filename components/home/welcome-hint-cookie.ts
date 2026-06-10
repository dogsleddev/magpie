// Shared between the server page (reads it) and the client hint (sets it).
// Lives outside the 'use client' module so the server gets a real string.
export const WELCOME_HINT_COOKIE = 'magpie_hint_dismissed';
