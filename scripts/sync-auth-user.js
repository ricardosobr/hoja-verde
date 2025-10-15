/**
 * Script to sync auth.users with users table
 * Creates missing user profiles in the users table
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

// Create Supabase client with service role (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function syncAuthUser(email) {
  console.log(`\n🔍 Looking for user: ${email}`)

  try {
    // 1. Get user from auth.users using admin API
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
      console.error('❌ Error listing auth users:', authError)
      return
    }

    const authUser = authData.users.find(u => u.email === email)

    if (!authUser) {
      console.error(`❌ User ${email} not found in auth.users`)
      return
    }

    console.log(`✅ Found in auth.users:`)
    console.log(`   - ID: ${authUser.id}`)
    console.log(`   - Email: ${authUser.email}`)
    console.log(`   - Created: ${authUser.created_at}`)

    // 2. Check if user exists in users table
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('id', authUser.id)
      .single()

    if (existingUser) {
      console.log(`\n✅ User already exists in users table:`)
      console.log(`   - Role: ${existingUser.role}`)
      return
    }

    // 3. Create user in users table
    console.log(`\n📝 Creating user in users table...`)

    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        id: authUser.id,
        email: authUser.email,
        full_name: authUser.user_metadata?.full_name || email.split('@')[0],
        role: 'client', // Default role, change to 'admin' if needed
        status: 'active'
      })
      .select()
      .single()

    if (insertError) {
      console.error('❌ Error creating user:', insertError)
      return
    }

    console.log(`✅ User created successfully in users table!`)
    console.log(`   - ID: ${authUser.id}`)
    console.log(`   - Email: ${authUser.email}`)
    console.log(`   - Role: client`)
    console.log(`   - Status: active`)

    console.log(`\n🎉 Done! User can now login and will be redirected to /client/dashboard`)

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the script
const email = process.argv[2] || 'tester001@koklin.com'
syncAuthUser(email)
