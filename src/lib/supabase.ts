import { createClient, type SupabaseClient } from "@supabase/supabase-js";
let client: SupabaseClient | null = null;
export function supabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (!client)
    client = createClient(url, key, {
      global: {
        fetch: async (input, init) => {
          const controller = new AbortController();
          const abort = () => controller.abort();
          init?.signal?.addEventListener("abort", abort, { once: true });
          const timeout = setTimeout(abort, 10000);
          try {
            return await fetch(input, { ...init, signal: controller.signal });
          } finally {
            clearTimeout(timeout);
            init?.signal?.removeEventListener("abort", abort);
          }
        },
      },
    });
  return client;
}
