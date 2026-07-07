import { geminiLogin } from '@/lib/actions/demo-login';

/**
 * QR direct link for the Gemini meetup: magpie.wiki/gemini signs the visitor
 * into the shared presentation account and redirects into the app. Signing in
 * needs to write session cookies, which a page render cannot do, so this is a
 * route handler instead of a page.
 */
export async function GET() {
  await geminiLogin();
}
