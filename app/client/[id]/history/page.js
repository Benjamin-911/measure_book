'use client';

import { useEffect, useState, Fragment } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { FIELD_GROUPS } from '@/lib/fields';

const UNIT_LABEL = { in: '"', cm: ' cm' };

const ALL_FIELDS = Array.from(
  new Map(
    FIELD_GROUPS.flatMap((g) => g.fields).map((f) => [f.key, f])
  ).values()
);

export default function MeasurementHistory() {
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: clientData } = await supabase
        .from('clients')
        .select('name, phone')
        .eq('id', id)
        .single();
      setClient(clientData || null);

      const { data: historyRows } = await supabase
        .from('measurement_history')
        .select('*')
        .eq('client_id', id)
        .order('taken_date', { ascending: true });

      const pastEntries = (historyRows || []).map((row) => ({
        ...row.snapshot,
        taken_date: row.taken_date,
        _key: row.id,
      }));

      const { data: currentProfile } = await supabase
        .from('measurement_profiles')
        .select('*')
        .eq('client_id', id)
        .order('taken_date', { ascending: false })
        .limit(1)
        .single();

      const combined = [...pastEntries];
      if (currentProfile) {
        combined.push({ ...currentProfile, _key: 'current', _isCurrent: true });
      }

      setEntries(combined);
      setLoading(false);
    }
    if (id) load();
  }, [id]);

  if (loading) {
    return (
      <main className="page-container">
        <div className="skeleton" style={{ height: 20, width: 120, marginBottom: 24 }} />
        <div className="skeleton" style={{ height: 120, marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 120 }} />
      </main>
    );
  }

  const chronological = entries;
  const display = [...entries].reverse();

  return (
    <main className="page-container">
      <Link href={`/client/${id}`} className="back-link">← Back</Link>

      <div className="profile-header">
        <div className="profile-info">
          <div className="profile-name">{client?.name}</div>
          <div style={{ marginTop: 6 }}>
            <span className="badge badge-muted">
              {entries.length} {entries.length === 1 ? 'measurement' : 'measurements'} recorded
            </span>
          </div>
        </div>
      </div>

      {entries.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📏</div>
          <div className="empty-text">No measurements recorded yet</div>
        </div>
      )}

      {display.map((entry, displayIndex) => {
        const chronoIndex = chronological.findIndex((e) => e._key === entry._key);
        const previous = chronoIndex > 0 ? chronological[chronoIndex - 1] : null;
        const entryUnit = entry.unit === 'cm' ? 'cm' : 'in';
        const unitSuffix = UNIT_LABEL[entryUnit];
        const unitChanged = previous && (previous.unit === 'cm' ? 'cm' : 'in') !== entryUnit;

        const changedKeys = new Set(
          previous && !unitChanged
            ? ALL_FIELDS.filter(
                (f) => String(entry[f.key] ?? '') !== String(previous[f.key] ?? '')
              ).map((f) => f.key)
            : []
        );

        return (
          <Fragment key={entry._key}>
            {displayIndex > 0 && <div className="tape-divider" />}
            <div className="measure-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span className="measure-section-title" style={{ marginBottom: 0 }}>
                  {entry.taken_date}
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span className="badge badge-muted">{entryUnit}</span>
                  {entry._isCurrent && <span className="badge badge-accent">Current</span>}
                </div>
              </div>

              {unitChanged && (
                <div className="inline-error" style={{ background: 'var(--secondary-bg)', color: 'var(--secondary)', border: 'none', marginBottom: 10 }}>
                  Unit changed from {previous.unit === 'cm' ? 'cm' : 'in'} — values below aren't directly comparable to the previous entry
                </div>
              )}

              <div className="measure-grid">
                {ALL_FIELDS.map((f) => {
                  const value = entry[f.key];
                  if (value === null || value === undefined || value === '') return null;
                  const changed = changedKeys.has(f.key);
                  return (
                    <div key={f.key} className="measure-cell">
                      <div className="measure-label">{f.label}</div>
                      <div className="measure-value">
                        {value}{unitSuffix}
                        {changed && previous && (
                          <span style={{ fontSize: 10, color: 'var(--ink-faint)', fontWeight: 400, display: 'block' }}>
                            was {previous[f.key]}{unitSuffix}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {entry.fit_notes && (
                <div className="notes-display" style={{ marginTop: 10 }}>
                  {entry.fit_notes}
                </div>
              )}
            </div>
          </Fragment>
        );
      })}
    </main>
  );
}