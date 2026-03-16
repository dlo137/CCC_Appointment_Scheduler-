'use client';

import { useEffect, useState } from 'react';
import { Service } from '@/types';
import {
  fetchAllServices,
  createService,
  updateService,
  deleteService,
} from '@/lib/admin';

interface ServiceForm {
  name: string;
  durationMin: string;
  price: string;
}

const EMPTY_FORM: ServiceForm = { name: '', durationMin: '30', price: '' };

function formatPrice(p: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(p);
}

export default function ServicesManager() {
  const [services, setServices]     = useState<Service[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showAdd, setShowAdd]       = useState(false);
  const [addForm, setAddForm]       = useState<ServiceForm>(EMPTY_FORM);
  const [addBusy, setAddBusy]       = useState(false);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [editForm, setEditForm]     = useState<ServiceForm>(EMPTY_FORM);
  const [editBusy, setEditBusy]     = useState(false);
  const [error, setError]           = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try { setServices(await fetchAllServices()); }
    catch (e) { setError(e instanceof Error ? e.message : 'Load failed'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  // ── add ────────────────────────────────────────────────────────────────────
  async function handleAdd() {
    const dur = parseInt(addForm.durationMin);
    const price = parseFloat(addForm.price);
    if (!addForm.name.trim() || isNaN(dur) || isNaN(price)) return;

    setAddBusy(true);
    setError(null);
    try {
      const svc = await createService({ name: addForm.name.trim(), durationMin: dur, price });
      setServices((prev) => [...prev, svc]);
      setAddForm(EMPTY_FORM);
      setShowAdd(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Create failed');
    } finally {
      setAddBusy(false);
    }
  }

  // ── edit ───────────────────────────────────────────────────────────────────
  function startEdit(svc: Service) {
    setEditingId(svc.id);
    setEditForm({
      name:        svc.name,
      durationMin: String(svc.duration_minutes),
      price:       String(svc.price),
    });
  }

  async function handleSaveEdit(id: string) {
    const dur   = parseInt(editForm.durationMin);
    const price = parseFloat(editForm.price);
    if (!editForm.name.trim() || isNaN(dur) || isNaN(price)) return;

    setEditBusy(true);
    setError(null);
    try {
      await updateService(id, { name: editForm.name.trim(), durationMin: dur, price });
      setServices((prev) =>
        prev.map((s) =>
          s.id === id
            ? { ...s, name: editForm.name.trim(), duration_minutes: dur, price }
            : s,
        ),
      );
      setEditingId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setEditBusy(false);
    }
  }

  // ── toggle active ─────────────────────────────────────────────────────────
  async function handleToggle(svc: Service) {
    try {
      await updateService(svc.id, { active: !svc.active });
      setServices((prev) =>
        prev.map((s) => (s.id === svc.id ? { ...s, active: !s.active } : s)),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed');
    }
  }

  // ── delete ─────────────────────────────────────────────────────────────────
  async function handleDelete(id: string) {
    if (!confirm('Delete this service? This cannot be undone.')) return;
    try {
      await deleteService(id);
      setServices((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed');
    }
  }

  return (
    <div>
      {/* header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-white">Services</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Services appear in the customer booking flow when active.
          </p>
        </div>
        <button
          onClick={() => { setShowAdd((v) => !v); setAddForm(EMPTY_FORM); }}
          className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-400"
        >
          {showAdd ? 'Cancel' : '+ Add service'}
        </button>
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-red-900 bg-red-950/40 px-4 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      {/* add form */}
      {showAdd && (
        <div className="mb-4 rounded-xl border border-brand-500/40 bg-zinc-900 p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-4">
            New service
          </p>
          <ServiceFormFields form={addForm} onChange={setAddForm} />
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleAdd}
              disabled={addBusy || !addForm.name.trim() || !addForm.price}
              className="rounded-lg bg-brand-500 px-5 py-2 text-sm font-bold text-white transition hover:bg-brand-400 disabled:opacity-40"
            >
              {addBusy ? 'Adding…' : 'Add service'}
            </button>
          </div>
        </div>
      )}

      {/* list */}
      {loading ? (
        <div className="py-8 text-center text-sm text-zinc-600">Loading…</div>
      ) : services.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 py-12 text-center text-sm text-zinc-600">
          No services yet. Add one above.
        </div>
      ) : (
        <div className="space-y-2">
          {services.map((svc) =>
            editingId === svc.id ? (
              /* edit mode */
              <div key={svc.id} className="rounded-xl border border-brand-500/40 bg-zinc-900 p-5">
                <ServiceFormFields form={editForm} onChange={setEditForm} />
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => handleSaveEdit(svc.id)}
                    disabled={editBusy}
                    className="rounded-lg bg-brand-500 px-5 py-2 text-sm font-bold text-white transition hover:bg-brand-400 disabled:opacity-40"
                  >
                    {editBusy ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:text-white transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* view mode */
              <div
                key={svc.id}
                className={`flex flex-wrap items-center gap-4 rounded-xl border px-5 py-4 transition-opacity ${
                  svc.active
                    ? 'border-zinc-800 bg-zinc-900'
                    : 'border-zinc-800 bg-zinc-900/40 opacity-60'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm">{svc.name}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {svc.duration_minutes} min · {formatPrice(svc.price)}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* active toggle */}
                  <button
                    onClick={() => handleToggle(svc)}
                    className={`rounded-full px-3 py-1 text-xs font-bold border transition ${
                      svc.active
                        ? 'border-green-700 bg-green-950/40 text-green-400 hover:bg-green-950'
                        : 'border-zinc-700 bg-zinc-800 text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {svc.active ? 'Active' : 'Inactive'}
                  </button>

                  <button
                    onClick={() => startEdit(svc)}
                    className="rounded-lg border border-zinc-700 px-3 py-1 text-xs font-semibold text-zinc-400 transition hover:border-zinc-500 hover:text-white"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleDelete(svc.id)}
                    className="rounded-lg border border-red-900/50 px-3 py-1 text-xs font-semibold text-red-500 transition hover:bg-red-950/30"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}

function ServiceFormFields({
  form,
  onChange,
}: {
  form: ServiceForm;
  onChange: (f: ServiceForm) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div className="sm:col-span-1">
        <label className="block text-xs font-semibold text-zinc-400 mb-1">Service name</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => onChange({ ...form, name: e.target.value })}
          placeholder="e.g. Haircut"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-brand-500"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-zinc-400 mb-1">Duration (min)</label>
        <input
          type="number"
          min={5}
          step={5}
          value={form.durationMin}
          onChange={(e) => onChange({ ...form, durationMin: e.target.value })}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-brand-500"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-zinc-400 mb-1">Price ($)</label>
        <input
          type="number"
          min={0}
          step={0.5}
          value={form.price}
          onChange={(e) => onChange({ ...form, price: e.target.value })}
          placeholder="35.00"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-brand-500"
        />
      </div>
    </div>
  );
}
