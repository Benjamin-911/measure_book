'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getInitials } from '@/lib/utils';

export default function Home() {
  const [clients, setClients] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadClients() {
      const { data, error: loadError } = await supabase
        .from('clients')
        .select('id, name, phone, measurement_profiles(taken_date)')
        .order('name')
        .order('taken_date', { foreignTable: 'measurement_profiles', ascending: false });

      if (loadError) {
        setError(loadError.message);
      } else {
        setClients(data || []);
      }
      setLoading(false);
    }
    loadClients();
  }, []);

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase())
  );

  const measuredCount = clients.filter(
    (c) => c.measurement_profiles && c.measurement_profiles.length > 0
  ).length;

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  return (
    <main className="page-container has-action-bar">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Measure Track</h1>
          <p className="page-subtitle">Client measurement manager</p>
        </div>
        <button
          onClick={handleSignOut}
          style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '12px', fontWeight: '500', cursor: 'pointer', fontFamily: 'var(--font-sans)', padding: '4px 0' }}
        >
          Sign Out
        </button>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">{loading ? '–' : clients.length}</div>
          <div className="stat-label">Clients</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{loading ? '–' : measuredCount}</div>
          <div className="stat-label">Measured</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{loading ? '–' : clients.length - measuredCount}</div>
          <div className="stat-label">Pending</div>
        </div>
      </div>

      <div className="search-wrapper">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-input"
          placeholder="Search clients…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {error && (
        <div className="inline-error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="client-list">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 72 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👗</div>
          <div className="empty-text">
            {query ? 'No clients match your search' : 'No clients yet — add your first one!'}
          </div>
        </div>
      ) : (
        <div className="client-list stagger">
          {filtered.map((client) => {
            const lastDate = client.measurement_profiles?.[0]?.taken_date;
            return (
              <Link key={client.id} href={`/client/${client.id}`}>
                <div className="card card-interactive client-card" style={{ animationName: 'slideUp', animationDuration: '0.35s', animationFillMode: 'both' }}>
                  <div className="client-avatar">{getInitials(client.name)}</div>
                  <div className="client-info">
                    <div className="client-name">{client.name}</div>
                    <div className="client-meta">
                      {lastDate ? `Measured ${lastDate}` : 'Not measured yet'}
                      {client.phone ? ` · ${client.phone}` : ''}
                    </div>
                  </div>
                  <span className="client-arrow">›</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <div className="action-bar">
        <div className="action-bar-inner">
          <Link href="/client/new" className="btn btn-primary btn-full">
            ＋ New Client
          </Link>
        </div>
      </div>
    </main>
  );
}
