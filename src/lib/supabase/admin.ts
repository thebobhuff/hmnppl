/**
 * Supabase admin client using the service role key.
 *
 * Bypasses Row Level Security (RLS). Use ONLY for:
 *   - Creating users during signup (before profile exists)
 *   - Creating companies during signup
 *   - OAuth callback profile creation
 *   - Administrative operations that require elevated access
 *
 * NEVER expose the service role key to the client.
 */
import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is required for admin operations. " +
        "Check your .env.local file.",
    );
  }

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
