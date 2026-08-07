import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { playerService } from '../services/team.service';

export default function PlayersPage() {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useQuery({ queryKey: ['players', search], queryFn: () => playerService.getPlayers(search ? { search } : {}) });
  const players = data?.players || [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-24 lg:pb-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="font-display font-bold text-2xl">Players</h1>
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={16} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search players..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-sm focus:outline-none focus:border-brand-500" />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {isLoading ? [1,2,3,4,5].map(i => <div key={i} className="card skeleton h-40" />) :
          players.map((player: any) => (
            <Link key={player.id} to={`/players/${player.id}`} className="card card-hover p-4 flex flex-col items-center gap-2 text-center">
              <div className="w-16 h-16 rounded-full bg-brand-600/20 flex items-center justify-center font-bold text-brand-400 text-xl">
                {player.photo ? <img src={player.photo} className="w-full h-full object-cover rounded-full" /> : player.name.charAt(0)}
              </div>
              <div className="font-semibold text-sm text-[var(--color-text)] leading-tight">{player.name}</div>
              <div className="text-xs text-[var(--color-text-muted)]">{player.role?.replace(/_/g, ' ')}</div>
              <div className="text-xs text-brand-400">{player.team?.shortName || 'Free Agent'}</div>
            </Link>
          ))
        }
      </div>
    </div>
  );
}
