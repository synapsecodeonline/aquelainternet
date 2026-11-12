import { createClient } from "@supabase/supabase-js";

function createAppClient(url: string, key: string) {
  return createClient(url, key, {
    db: { schema: "aquelainternet" },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

type AppClient = ReturnType<typeof createAppClient>;

let client: AppClient | null = null;

/**
 * Cliente Supabase server-side. Se as env vars não estiverem configuradas,
 * retorna null e o app opera em modo sem cache persistente (só memória).
 */
export function getSupabase(): AppClient | null {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  client = createAppClient(url, key);
  return client;
}
