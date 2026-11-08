import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { AUTH_DISABLED } from "@/lib/authMode";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Create a fresh server client for every request. The proxy owns the
  // refresh-token lifecycle for SSR and keeps browser/server cookies aligned.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          supabaseResponse = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Do not remove this call. It validates the current claims and, when the
  // access token is expired, lets Supabase refresh the session and write the
  // rotated cookies back to both the request and response.
  const { data } = await supabase.auth.getClaims();
  let user = data?.claims;
  const path = request.nextUrl.pathname;
  const isAuthScreen = path === "/auth";

  // Testing mode: skip the login screen by starting an anonymous session.
  if (AUTH_DISABLED && (path.startsWith("/dashboard") || isAuthScreen)) {
    if (!user) {
      const { data: anon, error } = await supabase.auth.signInAnonymously();
      if (!error && anon.session) user = anon.session.user as unknown as typeof user;
    }
    if (user && isAuthScreen) {
      const url = request.nextUrl.clone();
      url.pathname = request.nextUrl.searchParams.get("next") || "/dashboard";
      url.search = "";
      const redirect = NextResponse.redirect(url);
      supabaseResponse.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
      return redirect;
    }
  }

  // Only protected dashboard routes are redirected. API routes and public
  // pages still receive the refreshed cookies without being redirected.
  if (!user && (path.startsWith("/dashboard") || path.startsWith("/test.html"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    url.search = `?next=${encodeURIComponent(request.nextUrl.pathname)}`;
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
