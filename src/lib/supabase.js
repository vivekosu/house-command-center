import { createClient } from '@supabase/supabase-js'

// Custom fetch wrapper that explicitly bypasses any service worker cache.
// iOS Safari + PWA service workers sometimes intercept fetches and return
// stale or broken responses ("TypeError: Load failed").
// Setting cache: 'no-store' and using a fresh request prevents this.
const noCacheFetch = (url, options = {}) => {
  return fetch(url, {
    ...options,
    cache: 'no-store',
    credentials: 'omit',
    keepalive: false,
  })
}

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      fetch: noCacheFetch,
    },
    db: {
      schema: 'public',
    },
  }
)
