import 'server-only'

import { getSupabaseAdmin } from '@/lib/supabase-admin'

/** Mismo chequeo que usan las demás rutas /api/admin: admin activo por id. */
export async function getAuthorizedAdminClient(request: Request) {
  const adminId = request.headers.get('x-admin-id')
  if (!adminId) return null
  const client = getSupabaseAdmin()
  const { data } = await client
    .from('admin_credentials')
    .select('id')
    .eq('id', adminId)
    .eq('is_active', true)
    .maybeSingle()
  return data ? client : null
}
