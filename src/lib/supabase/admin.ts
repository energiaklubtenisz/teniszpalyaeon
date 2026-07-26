import { createClient } from "@supabase/supabase-js";

import {
  getSupabaseServiceRoleKey,
  getSupabaseUrl,
} from "@/lib/env";
import type { Database } from "@/types/database.types";

export function createAdminClient() {
  const serviceRoleKey = getSupabaseServiceRoleKey();

  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not configured. Account deletion requires the service role key.",
    );
  }

  return createClient<Database>(getSupabaseUrl(), serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
