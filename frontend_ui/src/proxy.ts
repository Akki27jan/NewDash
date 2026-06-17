import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  // Check if the access_token cookie is present
  const token = request.cookies.get('access_token');
  
  if (!token) {
    // Redirect unauthenticated users to the login page
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Allow the request to proceed if authenticated
  return NextResponse.next();
}

// Specify the paths where the middleware should run
export const config = {
  matcher: '/dashboard/:path*',
};
