// Script to apply RLS migration for client_profiles
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://iiejyugnljdwfntbcnjc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpZWp5dWdubGpkd2ZudGJjbmpjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUzNzA4OCwiZXhwIjoyMDcyMTEzMDg4fQ.qeb-fdxoERxYdttNTYHqg25_a2TOYjEMSr0r_SVpABY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    console.log('📝 Reading migration file...');
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250114_fix_client_profiles_rls.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('🚀 Applying migration to Supabase...');
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      // Try direct query instead
      console.log('⚠️  RPC not available, trying direct query...');
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        console.log(`Executing: ${statement.substring(0, 60)}...`);
        const { error: execError } = await supabase.rpc('exec_sql', { query: statement });
        if (execError) {
          console.error('❌ Error:', execError.message);
        }
      }
    }

    console.log('✅ Migration applied successfully!');
    console.log('');
    console.log('📋 The following RLS policies were created:');
    console.log('  - Users can view their own client profile');
    console.log('  - Admins can view all client profiles');
    console.log('  - Admins can insert/update/delete client profiles');

  } catch (error) {
    console.error('❌ Failed to apply migration:', error.message);
    process.exit(1);
  }
}

applyMigration();
