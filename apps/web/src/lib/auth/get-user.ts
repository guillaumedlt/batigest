import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from './jwt';

/**
 * Recupere l'ID utilisateur depuis le cookie JWT.
 * Retourne null si pas authentifie.
 */
export async function getAuthUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = await verifyToken(token);
    return payload?.userId || null;
  } catch {
    return null;
  }
}
