import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nzvepysnmmzznwljvvpe.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56dmVweXNubW16em53bGp2dnBlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODAyNDc0NywiZXhwIjoyMTAzNjAwNzQ3fQ.6SjJ3OL0VxTC1g9QlrmyqgvUDdpzAAXIE52fCKE47Qw';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const SUPERVISOR_ACCOUNTS = [
  {
    email: 'sup.jharia@kholan.in',
    password: 'supervisor123',
    official_id: 'sup.jharia',
    name: 'Jharia Mine Supervisor',
    site: 'Jharia Mine',
  },
  {
    email: 'sup.bokaro@kholan.in',
    password: 'supervisor123',
    official_id: 'sup.bokaro',
    name: 'Bokaro Steel Supervisor',
    site: 'Bokaro Steel',
  },
  {
    email: 'sup.dhanbad@kholan.in',
    password: 'supervisor123',
    official_id: 'sup.dhanbad',
    name: 'Dhanbad Wash Supervisor',
    site: 'Dhanbad Wash',
  }
];

async function setup() {
  const { data: listData } = await supabase.auth.admin.listUsers();
  const existingUsers = listData?.users || [];

  for (const acc of SUPERVISOR_ACCOUNTS) {
    let user = existingUsers.find(u => u.email === acc.email);

    if (!user) {
      console.log(`Creating auth user ${acc.email}...`);
      const { data: createData, error: createError } = await supabase.auth.admin.createUser({
        email: acc.email,
        password: acc.password,
        email_confirm: true,
        user_metadata: {
          role: 'supervisor',
          site: acc.site,
          name: acc.name,
          official_id: acc.official_id,
        },
        app_metadata: {
          role: 'supervisor',
          site: acc.site,
        }
      });
      if (createError) {
        console.error(`Error creating ${acc.email}:`, createError);
        continue;
      }
      user = createData.user;
    } else {
      console.log(`Updating existing auth user ${acc.email}...`);
      const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
        password: acc.password,
        email_confirm: true,
        user_metadata: {
          role: 'supervisor',
          site: acc.site,
          name: acc.name,
          official_id: acc.official_id,
        },
        app_metadata: {
          role: 'supervisor',
          site: acc.site,
        }
      });
      if (updateError) {
        console.error(`Error updating ${acc.email}:`, updateError);
        continue;
      }
      user = updateData.user;
    }

    console.log(`Upserting users record for ${acc.name} (${user.id})...`);
    const { error: upsertErr } = await supabase.from('users').upsert({
      id: user.id,
      name: acc.name,
      role: 'supervisor',
      official_id: acc.official_id
    });
    if (upsertErr) {
      console.error(`Error upserting to users table:`, upsertErr);
    } else {
      console.log(`Successfully configured ${acc.site} -> ${acc.official_id}`);
    }
  }
}

setup();
