import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nzvepysnmmzznwljvvpe.supabase.co';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56dmVweXNubW16em53bGp2dnBlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODAyNDc0NywiZXhwIjoyMTAzNjAwNzQ3fQ.6SjJ3OL0VxTC1g9QlrmyqgvUDdpzAAXIE52fCKE47Qw';

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function getAuthenticatedSupervisor(request: Request) {
  // 1. Get access token from Authorization header or cookie
  const authHeader = request.headers.get('Authorization');
  let token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.split('; ').find(row => row.startsWith('kholan_session='));
    if (match) {
      token = match.split('=')[1];
    }
  }

  if (!token) {
    return { error: 'Unauthorized: No active session found', status: 401 };
  }

  // 2. Validate token with Supabase Auth
  const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !user) {
    return { error: 'Unauthorized: Invalid or expired session token', status: 401 };
  }

  // 3. Derive role and site strictly from user's authenticated identity
  const role = user.user_metadata?.role || user.app_metadata?.role;
  let site = user.user_metadata?.site || user.app_metadata?.site;

  // Site fallback mapping for supervisor accounts if missing from metadata
  if (!site) {
    const email = user.email?.toLowerCase() || '';
    if (email.includes('jharia')) site = 'Jharia Mine';
    else if (email.includes('bokaro')) site = 'Bokaro Steel';
    else if (email.includes('dhanbad')) site = 'Dhanbad Wash';
  }

  if (!site) {
    return { error: 'Forbidden: No site assigned to this supervisor account', status: 403 };
  }

  return {
    user,
    site,
    role: role || 'supervisor',
    name: user.user_metadata?.name || user.email?.split('@')[0] || 'Supervisor'
  };
}
