/**
 * Server-side Supabase client with cookie-based session management.
 *
 * Use this in Server Components, Server Actions, and Route Handlers.
 * Reads and writes auth cookies via Next.js `cookies()` API.
 *
 * Note: `setAll` silently fails in Server Components (cookies are read-only).
 * The middleware handles session refresh for Server Components.
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...options,
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                path: "/",
              }),
            );
          } catch {
            // `setAll` was called from a Server Component where cookies
            // are read-only. The middleware will refresh the session instead.
          }
        },
      },
    },
  );
}
