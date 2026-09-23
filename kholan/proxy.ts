import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = request.cookies.get('kholan_role')?.value;
  const session = request.cookies.get('kholan_session')?.value;

  // Public routes
  if (pathname.startsWith('/login') || pathname.startsWith('/verify')) {
    return NextResponse.next();
  }

  // Not authenticated
  if (!session || !role) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Role-based protection
  if (pathname.startsWith('/supervisor') && role !== 'supervisor') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (pathname.startsWith('/dgms') && role !== 'dgms') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/supervisor/:path*', '/dgms/:path*'],
};
