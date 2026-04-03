import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Service-role client — initialised lazily so the module loads during static export
function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

async function verifyAdmin(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return null;

  const admin = getAdmin();
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return null;

  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return profile?.role === 'admin' ? user : null;
}

type Params = Promise<{ id: string }>;

// ── PATCH /api/admin/users/[id] — update profile + handle role changes ────────
export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  const adminUser = await verifyAdmin(req);
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const { full_name, phone, role, bio, available_hours } = await req.json();

  const supabaseAdmin = getAdmin();

  // Fetch current role to detect changes
  const { data: current } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', id)
    .single();

  // Update core profile fields
  const patch: Record<string, unknown> = {};
  if (full_name !== undefined) patch.full_name = full_name;
  if (phone     !== undefined) patch.phone     = phone;
  if (role      !== undefined) patch.role      = role;

  if (Object.keys(patch).length > 0) {
    const { error } = await supabaseAdmin.from('profiles').update(patch).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Handle role transitions
  const prevRole = current?.role;
  const newRole  = role ?? prevRole;

  if (newRole === 'barber' && prevRole !== 'barber') {
    // Promote → create (or reactivate) barbers row
    await supabaseAdmin.from('barbers').upsert(
      { profile_id: id, bio: bio ?? null, available_hours: {}, active: true },
      { onConflict: 'profile_id' },
    );
  } else if (prevRole === 'barber' && newRole !== 'barber') {
    // Demote → deactivate barbers row
    await supabaseAdmin.from('barbers').update({ active: false }).eq('profile_id', id);
  } else if (newRole === 'barber') {
    // Same role — update bio and/or available_hours
    const barberPatch: Record<string, unknown> = {};
    if (bio             !== undefined) barberPatch.bio             = bio;
    if (available_hours !== undefined) barberPatch.available_hours = available_hours;
    if (Object.keys(barberPatch).length > 0) {
      await supabaseAdmin.from('barbers').update(barberPatch).eq('profile_id', id);
    }
  }

  return NextResponse.json({ success: true });
}

// ── DELETE /api/admin/users/[id] — permanently remove user ───────────────────
export async function DELETE(req: NextRequest, { params }: { params: Params }) {
  const adminUser = await verifyAdmin(req);
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;

  if (id === adminUser.id) {
    return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
  }

  const { error } = await getAdmin().auth.admin.deleteUser(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
