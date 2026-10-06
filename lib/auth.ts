import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export type Role = 'admin' | 'super_admin'

export interface AuthenticatedUser {
    user: User
    role: Role
}

/**
 * Validates the request's `Authorization: Bearer <token>` header against
 * Supabase Auth. Role comes from app_metadata (writable only via the
 * service-role key, never by the user themselves) and defaults to the
 * more restrictive 'admin' whenever it isn't exactly 'super_admin'.
 */
export async function getAuthenticatedUser(request: Request): Promise<AuthenticatedUser | null> {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
        return null
    }

    const token = authHeader.slice('Bearer '.length)
    const { data, error } = await supabase.auth.getUser(token)

    if (error || !data.user) {
        return null
    }

    const role: Role = data.user.app_metadata?.role === 'super_admin' ? 'super_admin' : 'admin'

    return { user: data.user, role }
}
