import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Service-role client — never exposed to the browser
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

// ── auth guard ────────────────────────────────────────────────────────────────
async function verifyAdmin(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return null;

  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  if (!user) return null;

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return profile?.role === 'admin' ? user : null;
}

// ── POST /api/admin/users — create a new user ─────────────────────────────────
export async function POST(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { email, password, full_name, phone, role, bio } = await req.json();

  if (!email || !password || !role) {
    return NextResponse.json(
      { error: 'email, password, and role are required' },
      { status: 400 },
    );
  }

  // 1. Create the auth user (email_confirm: true skips the verification email)
  const { data: { user }, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: full_name ?? '', role },
  });

  if (createError || !user) {
    return NextResponse.json(
      { error: createError?.message ?? 'Failed to create user' },
      { status: 500 },
    );
  }

  // 2. The trigger creates the profile row; patch it with any extra fields
  await supabaseAdmin
    .from('profiles')
    .update({ full_name: full_name ?? null, phone: phone ?? null })
    .eq('id', user.id);

  // 3. If barber role, create the barbers row
  if (role === 'barber') {
    await supabaseAdmin.from('barbers').insert({
      profile_id:      user.id,
      bio:             bio ?? null,
      available_hours: {},
      active:          true,
    });
  }

  return NextResponse.json({ id: user.id }, { status: 201 });
}
