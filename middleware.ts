import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            response.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            response.cookies.delete({ name, ...options });
          },
        },
      }
    );

    const { data: { session } } = await supabase.auth.getSession();

    // Wenn kein Session vorhanden ist und die Route nicht /auth ist, leite zur Auth-Seite weiter
    if (!session && request.nextUrl.pathname !== '/auth') {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/auth';
      return NextResponse.redirect(redirectUrl);
    }

    // Wenn Session vorhanden ist und die Route /auth ist, leite zum Dashboard weiter
    if (session && request.nextUrl.pathname === '/auth') {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/';
      return NextResponse.redirect(redirectUrl);
    }
  } catch (error) {
    console.error('Middleware error:', error);
    
    // Bei einem Fehler erlauben wir den Zugriff auf die Auth-Seite und die statischen Assets
    if (request.nextUrl.pathname === '/auth' || 
        request.nextUrl.pathname.startsWith('/_next/') || 
        request.nextUrl.pathname.includes('favicon.ico')) {
      return response;
    }
    
    // Bei anderen Seiten leiten wir zur Auth-Seite um, wenn ein Fehler auftritt
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/auth';
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
