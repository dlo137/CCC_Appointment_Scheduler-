'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { UserProfile, UserRole } from '@/types';
import { fetchAllProfiles } from '@/lib/admin';

// ── types ─────────────────────────────────────────────────────────────────────

type AvailHours = Record<string, [string, string] | null | undefined>;

interface UserRow extends UserProfile {
  bio?:             string | null;
  available_hours?: AvailHours;
  barber_id?:       string; // barbers.id (not profile id)
}

interface AddForm {
  email:     string;
  password:  string;
  full_name: string;
  phone:     string;
  role:      UserRole;
  bio:       string;
}

interface EditForm {
  full_name:       string;
  phone:           string;
  role:            UserRole;
  bio:             string;
  available_hours: AvailHours;
}

const EMPTY_ADD: AddForm = {
  email: '', password: '', full_name: '', phone: '', role: 'customer', bio: '',
};

// ── availability constants ────────────────────────────────────────────────────

const DAYS = [
  { key: 'monday',    label: 'Mon' },
  { key: 'tuesday',   label: 'Tue' },
  { key: 'wednesday', label: 'Wed' },
  { key: 'thursday',  label: 'Thu' },
  { key: 'friday',    label: 'Fri' },
  { key: 'saturday',  label: 'Sat' },
  { key: 'sunday',    label: 'Sun' },
] as const;

type DayKey = typeof DAYS[number]['key'];

interface DayState { enabled: boolean; open: string; close: string }

function hoursToState(hours: AvailHours): Record<DayKey, DayState> {
  const out = {} as Record<DayKey, DayState>;
  for (const { key } of DAYS) {
    const h = hours[key];
    out[key] = h ? { enabled: true, open: h[0], close: h[1] } : { enabled: false, open: '09:00', close: '17:00' };
  }
  return out;
}

function stateToHours(state: Record<DayKey, DayState>): AvailHours {
  const out: AvailHours = {};
  for (const { key } of DAYS) {
    out[key] = state[key].enabled ? [state[key].open, state[key].close] : null;
  }
  return out;
}

// ── helpers ───────────────────────────────────────────────────────────────────

async function authToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Not authenticated');
  return session.access_token;
}

async function apiFetch(path: string, init: RequestInit) {
  const token = await authToken();
  const res   = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(init.headers ?? {}) },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? `Request failed (${res.status})`);
  return json;
}

// ── badge styles ──────────────────────────────────────────────────────────────

const ROLE_BADGE: Record<UserRole, string> = {
  customer: 'border-zinc-700 text-zinc-500 bg-zinc-800/40',
  barber:   'border-brand-600 text-brand-400 bg-brand-950/40',
  admin:    'border-purple-700 text-purple-400 bg-purple-950/40',
};

const ROLE_OPTIONS: UserRole[] = ['customer', 'barber', 'admin'];

const inputCls = 'w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-brand-500 transition';

// ── component ─────────────────────────────────────────────────────────────────

export default function BarbersManager() {
  const [users,      setUsers]      = useState<UserRow[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);

  const [showAdd,    setShowAdd]    = useState(false);
  const [addForm,    setAddForm]    = useState<AddForm>(EMPTY_ADD);
  const [addBusy,    setAddBusy]    = useState(false);

  const [editingId,  setEditingId]  = useState<string | null>(null);
  const [editForm,   setEditForm]   = useState<EditForm | null>(null);
  const [dayState,   setDayState]   = useState<Record<DayKey, DayState> | null>(null);
  const [editBusy,   setEditBusy]   = useState(false);

  const [viewingId,  setViewingId]  = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── load ────────────────────────────────────────────────────────────────────
  async function load() {
    setLoading(true);
    setError(null);
    try {
      const profiles = await fetchAllProfiles();

      const { data: barberRows } = await supabase
        .from('barbers')
        .select('id, profile_id, bio, available_hours');

      const barberMap: Record<string, { id: string; bio: string | null; available_hours: AvailHours }> = {};
      for (const b of barberRows ?? []) {
        barberMap[b.profile_id] = { id: b.id, bio: b.bio, available_hours: b.available_hours ?? {} };
      }

      setUsers(profiles.map((p) => ({
        ...p,
        bio:             barberMap[p.id]?.bio ?? null,
        available_hours: barberMap[p.id]?.available_hours ?? {},
        barber_id:       barberMap[p.id]?.id,
      })));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // ── create ──────────────────────────────────────────────────────────────────
  async function handleCreate() {
    if (!addForm.email || !addForm.password || !addForm.full_name) {
      setError('Email, password, and full name are required.');
      return;
    }
    setAddBusy(true);
    setError(null);
    try {
      await apiFetch('/api/admin/users', { method: 'POST', body: JSON.stringify(addForm) });
      setAddForm(EMPTY_ADD);
      setShowAdd(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Create failed');
    } finally {
      setAddBusy(false);
    }
  }

  // ── edit ────────────────────────────────────────────────────────────────────
  function startEdit(user: UserRow) {
    const hours = user.available_hours ?? {};
    setEditingId(user.id);
    setViewingId(null);
    setEditForm({
      full_name:       user.full_name ?? '',
      phone:           user.phone    ?? '',
      role:            user.role,
      bio:             user.bio      ?? '',
      available_hours: hours,
    });
    setDayState(hoursToState(hours));
  }

  async function handleSaveEdit(userId: string) {
    if (!editForm || !dayState) return;
    setEditBusy(true);
    setError(null);
    try {
      const payload = {
        ...editForm,
        available_hours: editForm.role === 'barber' ? stateToHours(dayState) : undefined,
      };
      await apiFetch(`/api/admin/users/${userId}`, { method: 'PATCH', body: JSON.stringify(payload) });
      setEditingId(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setEditBusy(false);
    }
  }

  // ── delete ──────────────────────────────────────────────────────────────────
  async function handleDelete(userId: string) {
    setDeletingId(userId);
    setError(null);
    try {
      await apiFetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  }

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div>
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-white">Users & Barbers</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Create users and set barber schedules. Only barbers with hours configured appear in booking.
          </p>
        </div>
        <button
          onClick={() => { setShowAdd((v) => !v); setAddForm(EMPTY_ADD); setError(null); }}
          className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-400 shrink-0"
        >
          {showAdd ? 'Cancel' : '+ Add user'}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-900 bg-red-950/40 px-4 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* ── add form ── */}
      {showAdd && (
        <div className="mb-5 rounded-xl border border-brand-500/40 bg-zinc-900 p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-4">New user</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Full name *">
              <input type="text" value={addForm.full_name} placeholder="Watson Smith" className={inputCls}
                onChange={(e) => setAddForm({ ...addForm, full_name: e.target.value })} />
            </Field>
            <Field label="Email *">
              <input type="email" value={addForm.email} placeholder="watson@example.com" className={inputCls}
                onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} />
            </Field>
            <Field label="Password *">
              <input type="password" value={addForm.password} placeholder="Min. 8 characters" minLength={8} className={inputCls}
                onChange={(e) => setAddForm({ ...addForm, password: e.target.value })} />
            </Field>
            <Field label="Phone">
              <input type="tel" value={addForm.phone} placeholder="+1 555 000 0000" className={inputCls}
                onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })} />
            </Field>
            <Field label="Role">
              <RoleSelect value={addForm.role} onChange={(r) => setAddForm({ ...addForm, role: r })} />
            </Field>
            {addForm.role === 'barber' && (
              <Field label="Bio">
                <input type="text" value={addForm.bio} placeholder="e.g. specialises in fades" className={inputCls}
                  onChange={(e) => setAddForm({ ...addForm, bio: e.target.value })} />
              </Field>
            )}
          </div>
          {addForm.role === 'barber' && (
            <p className="mt-3 text-xs text-zinc-600">
              Available hours can be set after creation by editing the user.
            </p>
          )}
          <div className="mt-4">
            <button
              onClick={handleCreate}
              disabled={addBusy || !addForm.email || !addForm.password || !addForm.full_name}
              className="rounded-lg bg-brand-500 px-5 py-2 text-sm font-bold text-white transition hover:bg-brand-400 disabled:opacity-40 flex items-center gap-2"
            >
              {addBusy && <Spinner />}
              {addBusy ? 'Creating…' : 'Create user'}
            </button>
          </div>
        </div>
      )}

      {/* ── user list ── */}
      {loading ? (
        <div className="py-8 text-center text-sm text-zinc-600">Loading…</div>
      ) : users.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 py-12 text-center text-sm text-zinc-600">
          No users yet.
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((user) => {
            const isEditing  = editingId  === user.id;
            const isViewing  = viewingId  === user.id && !isEditing;
            const isDeleting = deletingId === user.id;

            return (
              <div key={user.id} className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">

                {/* main row */}
                <div className="flex flex-wrap items-center gap-3 px-5 py-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-sm font-bold text-zinc-300">
                    {(user.full_name ?? '?').slice(0, 2).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{user.full_name ?? '(no name)'}</p>
                    <p className="text-xs text-zinc-600 truncate">
                      Joined {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>

                  <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${ROLE_BADGE[user.role]}`}>
                    {user.role}
                  </span>

                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => { setViewingId(isViewing ? null : user.id); setEditingId(null); }}
                      className="rounded-lg border border-zinc-700 px-3 py-1 text-xs font-semibold text-zinc-400 transition hover:border-zinc-500 hover:text-white"
                    >
                      {isViewing ? 'Hide' : 'View'}
                    </button>
                    <button
                      onClick={() => isEditing ? setEditingId(null) : startEdit(user)}
                      className="rounded-lg border border-zinc-700 px-3 py-1 text-xs font-semibold text-zinc-400 transition hover:border-zinc-500 hover:text-white"
                    >
                      {isEditing ? 'Cancel' : 'Edit'}
                    </button>
                    <button
                      disabled={isDeleting}
                      onClick={() => {
                        if (!confirm(`Delete ${user.full_name ?? 'this user'}? This cannot be undone.`)) return;
                        handleDelete(user.id);
                      }}
                      className="rounded-lg border border-red-900/50 px-3 py-1 text-xs font-semibold text-red-500 transition hover:bg-red-950/30 disabled:opacity-40"
                    >
                      {isDeleting ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </div>

                {/* ── view panel ── */}
                {isViewing && (
                  <div className="border-t border-zinc-800 bg-zinc-900/60 px-5 py-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">Details</p>
                    <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 text-sm mb-4">
                      <DetailItem label="Full name" value={user.full_name} />
                      <DetailItem label="Phone"     value={user.phone} />
                      <DetailItem label="Role"      value={user.role} />
                      <DetailItem label="User ID"   value={user.id.slice(0, 8) + '…'} mono />
                      {user.role === 'barber' && (
                        <DetailItem label="Bio" value={user.bio} className="sm:col-span-2" />
                      )}
                    </dl>

                    {user.role === 'barber' && (
                      <>
                        <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Available hours</p>
                        <HoursReadOnly hours={user.available_hours ?? {}} />
                      </>
                    )}
                  </div>
                )}

                {/* ── edit panel ── */}
                {isEditing && editForm && dayState && (
                  <div className="border-t border-zinc-800 bg-zinc-900/60 px-5 py-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">Edit user</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                      <Field label="Full name">
                        <input type="text" value={editForm.full_name} className={inputCls}
                          onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} />
                      </Field>
                      <Field label="Phone">
                        <input type="tel" value={editForm.phone} placeholder="+1 555 000 0000" className={inputCls}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
                      </Field>
                      <Field label="Role">
                        <RoleSelect value={editForm.role}
                          onChange={(r) => {
                            setEditForm({ ...editForm, role: r });
                            if (r === 'barber' && !dayState) {
                              setDayState(hoursToState({}));
                            }
                          }} />
                      </Field>
                      {editForm.role === 'barber' && (
                        <Field label="Bio">
                          <input type="text" value={editForm.bio} placeholder="e.g. specialises in fades" className={inputCls}
                            onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} />
                        </Field>
                      )}
                    </div>

                    {/* available hours editor — only for barbers */}
                    {editForm.role === 'barber' && (
                      <div className="mb-4">
                        <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">
                          Available hours
                        </p>
                        <p className="text-xs text-zinc-600 mb-3">
                          Unchecked days are marked as off. Customers can only book within these hours.
                        </p>
                        <HoursEditor state={dayState} onChange={setDayState} />
                      </div>
                    )}

                    <div className="flex gap-2 pt-2 border-t border-zinc-800">
                      <button
                        onClick={() => handleSaveEdit(user.id)}
                        disabled={editBusy}
                        className="rounded-lg bg-brand-500 px-5 py-2 text-sm font-bold text-white transition hover:bg-brand-400 disabled:opacity-40 flex items-center gap-2"
                      >
                        {editBusy && <Spinner />}
                        {editBusy ? 'Saving…' : 'Save changes'}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:text-white transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── HoursEditor ───────────────────────────────────────────────────────────────

function HoursEditor({
  state,
  onChange,
}: {
  state: Record<DayKey, DayState>;
  onChange: (s: Record<DayKey, DayState>) => void;
}) {
  return (
    <div className="space-y-1.5">
      {DAYS.map(({ key, label }) => {
        const day = state[key];
        return (
          <div
            key={key}
            className={`flex flex-wrap items-center gap-3 rounded-lg border px-4 py-2.5 transition-colors ${
              day.enabled ? 'border-zinc-700 bg-zinc-800/60' : 'border-zinc-800 bg-zinc-900/40'
            }`}
          >
            <label className="flex items-center gap-2.5 cursor-pointer w-16 shrink-0">
              <input
                type="checkbox"
                checked={day.enabled}
                onChange={(e) => onChange({ ...state, [key]: { ...day, enabled: e.target.checked } })}
                className="h-4 w-4 rounded border-zinc-600 accent-brand-500 cursor-pointer"
              />
              <span className={`text-xs font-bold uppercase tracking-wider ${day.enabled ? 'text-white' : 'text-zinc-600'}`}>
                {label}
              </span>
            </label>

            {day.enabled ? (
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={day.open}
                  onChange={(e) => onChange({ ...state, [key]: { ...day, open: e.target.value } })}
                  className="rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-white outline-none focus:border-brand-500 [color-scheme:dark]"
                />
                <span className="text-zinc-600 text-xs">to</span>
                <input
                  type="time"
                  value={day.close}
                  onChange={(e) => onChange({ ...state, [key]: { ...day, close: e.target.value } })}
                  className="rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-white outline-none focus:border-brand-500 [color-scheme:dark]"
                />
              </div>
            ) : (
              <span className="text-xs text-zinc-700 font-medium">Day off</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── HoursReadOnly ─────────────────────────────────────────────────────────────

function HoursReadOnly({ hours }: { hours: AvailHours }) {
  const hasAny = DAYS.some(({ key }) => hours[key]);

  if (!hasAny) {
    return (
      <p className="text-xs text-amber-500/80 bg-amber-950/20 border border-amber-900/40 rounded-lg px-3 py-2">
        No hours set — this barber won't appear in the booking flow. Edit to configure.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
      {DAYS.map(({ key, label }) => {
        const h = hours[key];
        return (
          <div key={key} className={`rounded-lg border px-3 py-2 text-xs ${h ? 'border-zinc-700 bg-zinc-800/60' : 'border-zinc-800 opacity-40'}`}>
            <p className="font-bold uppercase tracking-wider text-zinc-500 mb-0.5">{label}</p>
            {h ? (
              <p className="text-zinc-300">{h[0]} – {h[1]}</p>
            ) : (
              <p className="text-zinc-600">Off</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── shared sub-components ─────────────────────────────────────────────────────

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-xs font-semibold text-zinc-400 mb-1">{label}</label>
      {children}
    </div>
  );
}

function RoleSelect({ value, onChange }: { value: UserRole; onChange: (r: UserRole) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as UserRole)}
      className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-brand-500 transition [color-scheme:dark]"
    >
      {ROLE_OPTIONS.map((r) => (
        <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
      ))}
    </select>
  );
}

function DetailItem({ label, value, mono = false, className = '' }: { label: string; value: string | null | undefined; mono?: boolean; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-xs text-zinc-600 uppercase tracking-wider font-semibold mb-0.5">{label}</dt>
      <dd className={`text-zinc-300 ${mono ? 'font-mono text-xs' : 'text-sm'}`}>
        {value ?? <span className="text-zinc-600">—</span>}
      </dd>
    </div>
  );
}

function Spinner() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />;
}
