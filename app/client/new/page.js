'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function NewClient() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSave() {
    if (!name.trim()) {
      setError('Client name is required');
      return;
    }
    setSaving(true);
    setError('');

    const { data, error: dbErr } = await supabase
      .from('clients')
      .insert({ name: name.trim(), phone: phone.trim() || null, notes: notes.trim() || null })
      .select()
      .single();

    if (dbErr) {
      setError(dbErr.message);
      setSaving(false);
      return;
    }

    if (data) {
      router.push(`/client/${data.id}`);
    }
  }

  return (
    <main className="page-container has-action-bar">
      {/* Back link */}
      <Link href="/" className="back-link">← Back</Link>

      <div className="page-header">
        <h1 className="page-title">New Client</h1>
        <p className="page-subtitle">Add a new client to start tracking measurements</p>
      </div>

      <div className="form-group">
        <label className="input-label">Client Name *</label>
        <input
          type="text"
          className="input"
          placeholder="e.g. Sarah Johnson"
          value={name}
          onChange={(e) => { setName(e.target.value); setError(''); }}
          autoFocus
        />
      </div>

      <div className="form-group">
        <label className="input-label">Phone (optional)</label>
        <input
          type="tel"
          className="input"
          placeholder="e.g. 076 123456"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="input-label">Notes (optional)</label>
        <textarea
          className="textarea"
          placeholder="Any notes about this client…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {error && (
        <div className="inline-error">
          {error}
        </div>
      )}

      {/* Action Bar (Anchored Bottom) */}
      <div className="action-bar">
        <div className="action-bar-inner">
           <button
             className="btn btn-primary btn-full"
             onClick={handleSave}
             disabled={saving}
           >
             {saving ? 'Saving…' : 'Save'}
           </button>
        </div>
      </div>
    </main>
  );
}
