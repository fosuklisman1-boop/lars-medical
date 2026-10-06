import { supabase } from '@/lib/supabase'

/**
 * Drop-in replacement for fetch() against this app's own /api routes —
 * attaches the current session's access token so API routes can
 * authenticate the caller. Falls back to a plain fetch with no auth
 * header if there's no active session (the route will 401).
 */
export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const { data: { session } } = await supabase.auth.getSession()

    const headers = new Headers(options.headers)
    if (session?.access_token) {
        headers.set('Authorization', `Bearer ${session.access_token}`)
    }

    return fetch(url, { ...options, headers })
}
