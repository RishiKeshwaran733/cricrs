import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { statsService } from '../services/team.service';
import { useDebounce } from '../hooks/useDebounce';
import { useQuery } from '@tanstack/react-query';

export default function SearchPage() {
  const [q, setQ] = useState('');
  const debouncedQ = useDebounce(q, 300);
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['search', debouncedQ],
    queryFn: () => statsService.search(debouncedQ),
    enabled: debouncedQ.length >= 2,
  });

  const results = data?.results;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-24 lg:pb-8">
      <h1 className="font-display font-bold text-2xl mb-6">Search</h1>
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={20} />
        <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search teams, players, tournaments..."
          className="w-full pl-12 pr-4 py-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] text-base focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
      </div>

      {isLoading && <div className="text-center text-[var(--color-text-muted)] py-8">Searching...</div>}

      {results && (
        <div className="space-y-6">
          {results.teams?.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase text-[var(--color-text-muted)] mb-2">Teams</h3>
              <div className="card divide-y divide-[var(--color-border)]">
                {results.teams.map((t: any) => (
                  <button key={t.id} onClick={() => navigate(`/teams/${t.id}`)} className="w-full flex items-center gap-3 p-3 hover:bg-[var(--color-surface-2)] transition-colors text-left">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ background: t.primaryColor }}>{t.shortName.substring(0,2)}</div>
                    <div><div className="font-semibold">{t.name}</div><div className="text-xs text-[var(--color-text-muted)]">{t.shortName}</div></div>
                  </button>
                ))}
              </div>
            </div>
          )}
          {results.players?.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase text-[var(--color-text-muted)] mb-2">Players</h3>
              <div className="card divide-y divide-[var(--color-border)]">
                {results.players.map((p: any) => (
                  <button key={p.id} onClick={() => navigate(`/players/${p.id}`)} className="w-full flex items-center gap-3 p-3 hover:bg-[var(--color-surface-2)] transition-colors text-left">
                    <div className="w-9 h-9 rounded-full bg-brand-600/20 flex items-center justify-center font-bold text-brand-400 text-sm">{p.name.charAt(0)}</div>
                    <div><div className="font-semibold">{p.name}</div><div className="text-xs text-[var(--color-text-muted)]">{p.team?.name}</div></div>
                  </button>
                ))}
              </div>
            </div>
          )}
          {results.tournaments?.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase text-[var(--color-text-muted)] mb-2">Tournaments</h3>
              <div className="card divide-y divide-[var(--color-border)]">
                {results.tournaments.map((t: any) => (
                  <button key={t.id} onClick={() => navigate(`/tournaments/${t.id}`)} className="w-full flex items-center gap-3 p-3 hover:bg-[var(--color-surface-2)] transition-colors text-left">
                    <div className="font-semibold">{t.name}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
          {results.teams?.length === 0 && results.players?.length === 0 && results.tournaments?.length === 0 && q.length >= 2 && (
            <div className="text-center py-12 text-[var(--color-text-muted)]">
              <Search size={40} className="mx-auto mb-3 opacity-30" />
              <p>No results for "{q}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
