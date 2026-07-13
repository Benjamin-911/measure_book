'use client';

import { useEffect, useState, useCallback, Fragment } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { FIELD_GROUPS } from '@/lib/fields';
import { getInitials } from '@/lib/utils';

export default function ClientProfile() {
  const { id } = useParams();
  const router = useRouter();
  const [client, setClient] = useState(null);
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [showDelete, setShowDelete] = useState(false);
  const [loading, setLoading] = useState(true);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  }, []);

  useEffect(() => {
    async function load() {
      const { data: clientData, error: cErr } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();

      if (cErr || !clientData) {
        setLoading(false);
        return;
      }
      setClient(clientData);

      const { data: profileData } = await supabase
        .from('measurement_profiles')
        .select('*')
        .eq('client_id', id)
        .order('taken_date', { ascending: false })
        .limit(1)
        .single();

      setProfile(profileData || null);
      setForm(profileData || {});
      setLoading(false);
    }
    if (id) load();
  }, [id]);

  function startEditing() {
    setForm(profile ? { ...profile } : {});
    setEditing(true);
    window.scrollTo(0, 0);
  }

  function cancelEditing() {
    setForm(profile || {});
    setEditing(false);
  }

  async function handleSave() {
    setSaving(true);

    if (profile) {
      const { error: historyError } = await supabase.from('measurement_history').insert({
        client_id: id,
        snapshot: profile,
        taken_date: profile.taken_date,
      });

      if (historyError) {
        showToast(historyError.message, 'error');
        setSaving(false);
        return;
      }
    }

    const record = {
      client_id: id,
      taken_date: new Date().toISOString().slice(0, 10),
    };

    FIELD_GROUPS.forEach((group) => {
      group.fields.forEach((f) => {
        const val = form[f.key];
        record[f.key] = val !== '' && val != null ? Number(val) : null;
      });
    });
    record.fit_notes = form.fit_notes || null;
    record.unit = form.unit || 'in';

    let result;

    if (profile) {
      const { data, error } = await supabase
        .from('measurement_profiles')
        .update(record)
        .eq('id', profile.id)
        .select()
        .single();
      result = { data, error };
    } else {
      const { data, error } = await supabase
        .from('measurement_profiles')
        .insert(record)
        .select()
        .single();
      result = { data, error };
    }

    if (result.error) {
      showToast(result.error.message, 'error');
    } else {
      setProfile(result.data);
      setForm(result.data);
      setEditing(false);
      showToast('Measurements saved');
    }
    setSaving(false);
  }

  async function handleDelete() {
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) {
      showToast(error.message, 'error');
      setShowDelete(false);
    } else {
      router.push('/');
    }
  }

  if (loading) {
    return (
      <main className="page-container">
        <div className="skeleton" style={{ height: 20, width: 120, marginBottom: 24 }} />
        <div className="skeleton" style={{ height: 72, marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 200 }} />
      </main>
    );
  }

  if (!client) {
    return (
      <main className="page-container">
        <Link href="/" className="back-link">← Back</Link>
        <div className="empty-state">
          <div className="empty-icon">🚫</div>
          <div className="empty-text">Client not found</div>
        </div>
      </main>
    );
  }

  return (
    <main className="page-container has-action-bar">
      {!editing && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" className="back-link">← Back</Link>
          <Link href={`/client/${id}/history`} className="back-link">History →</Link>
        </div>
      )}
      {editing && (
        <div className="back-link" onClick={cancelEditing}>Cancel Edit</div>
      )}

      <div className="profile-header">
        <div className="profile-avatar">{getInitials(client.name)}</div>
        <div className="profile-info">
          <div className="profile-name">{client.name}</div>
          {client.phone && <div className="profile-phone">{client.phone}</div>}
          <div style={{ marginTop: 6 }}>
            {profile ? (
              <span className="badge badge-accent">Measured {profile.taken_date}</span>
            ) : (
              <span className="badge badge-muted">Not measured yet</span>
            )}
          </div>
        </div>
      </div>

      {FIELD_GROUPS.map((group, gi) => (
        <Fragment key={group.label}>
          {gi > 0 && <div className="tape-divider" />}
          <div className="measure-section" style={{ animationDelay: `${gi * 0.05}s` }}>
            <div className="measure-section-title">{group.label}</div>
            <div className="measure-grid">
              {group.fields.map((f) => (
                <div key={f.key} className="measure-cell">
                  <div className="measure-label">{f.label}</div>
                  {editing ? (
                    <input
                      type="number"
                      inputMode="decimal"
                      className="measure-input"
                      placeholder="–"
                      value={form[f.key] ?? ''}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    />
                  ) : (
                    <div className={`measure-value ${!profile?.[f.key] ? 'measure-value-empty' : ''}`}>
                      {profile?.[f.key] ? profile[f.key] : '–'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Fragment>
      ))}

      <div className="tape-divider" />
      <div className="measure-section" style={{ animationDelay: '0.1s' }}>
        <div className="measure-section-title">Fit Notes</div>
        {editing ? (
          <textarea
            className="textarea"
            placeholder="Fit notes, preferences…"
            value={form.fit_notes || ''}
            onChange={(e) => setForm({ ...form, fit_notes: e.target.value })}
          />
        ) : (
          <div className="notes-display">
            {profile?.fit_notes ? profile.fit_notes : <span style={{ color: 'var(--ink-faint)' }}>No notes yet</span>}
          </div>
        )}
      </div>

      {!editing && (
        <div className="delete-zone">
          <button className="btn btn-danger btn-full" onClick={() => setShowDelete(true)}>
            Delete Client
          </button>
        </div>
      )}

      {showDelete && (
        <div className="confirm-overlay" onClick={() => setShowDelete(false)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-title">Delete {client.name}?</div>
            <div className="confirm-desc">
              This will permanently remove the client and all their measurements. This cannot be undone.
            </div>
            <div className="btn-row" style={{ justifyContent: 'center' }}>
              <button className="btn btn-ghost" onClick={() => setShowDelete(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <div className="action-bar">
        <div className="action-bar-inner">
          {editing ? (
            <button className="btn btn-primary btn-full" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          ) : (
            <button className="btn btn-primary btn-full" onClick={startEditing}>
              {profile ? 'Remeasure' : 'Add Measurements'}
            </button>
          )}
        </div>
      </div>

      {toast && (
        <div className={`toast ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}>
          {toast.message}
        </div>
      )}
    </main>
  );
}