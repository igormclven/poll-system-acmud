import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from './auth';

export async function proxy(request: NextRequest) {
  // Proteger rutas /admin/*
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const session = await auth();
    
    if (!session || !session.user) {
      // Redirigir a login si no está autenticado
      const loginUrl = new URL('/auth/signin', request.url);
      loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    // Excluir archivos estáticos y API routes de NextAuth
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};

