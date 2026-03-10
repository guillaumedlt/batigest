import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'batigest-dev-secret-change-in-production-2026'
);
const COOKIE_NAME = 'batigest-session';

// Routes publiques (pas besoin d'auth)
const PUBLIC_ROUTES = ['/login', '/signup', '/forgot-password', '/site'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Routes publiques
  const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));

  // Verifier le JWT
  const token = request.cookies.get(COOKIE_NAME)?.value;
  let isAuthenticated = false;

  if (token) {
    try {
      await jwtVerify(token, JWT_SECRET);
      isAuthenticated = true;
    } catch {
      // Token invalide ou expire
    }
  }

  // Rediriger vers login si pas connecte et route protegee
  if (!isAuthenticated && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Rediriger vers dashboard si connecte et sur login/signup
  if (isAuthenticated && (pathname === '/login' || pathname === '/signup')) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|manifest\\.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
