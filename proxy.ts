import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let isMaintenanceMode = false;
  
  try {
    const res = await fetch(new URL('/api/settings/maintenance', request.url), {
      cache: 'no-store'
    });
    if (res.ok) {
      const data = await res.json();
      isMaintenanceMode = data.maintenanceMode;
    }
  } catch (error) {
    isMaintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true';
  }

  if (isMaintenanceMode) {
    const { pathname } = request.nextUrl;
    
    // Blokir akses ke halaman /guru dan /ortu, serta API terkait
    if (
      pathname.startsWith('/guru') ||
      pathname.startsWith('/ortu') ||
      pathname.startsWith('/api/guru') ||
      pathname.startsWith('/api/ortu')
    ) {
      return NextResponse.redirect(new URL('/maintenance', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/guru/:path*',
    '/ortu/:path*',
    '/api/guru/:path*',
    '/api/ortu/:path*'
  ],
}
