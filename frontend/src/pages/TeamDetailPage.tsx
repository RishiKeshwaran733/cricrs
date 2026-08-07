import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { teamService } from '../services/team.service';
import { ArrowLeft } from 'lucide-react';

export default function TeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useQuery({ queryKey: ['team', id], queryFn: () => teamService.getTeam(id!), enabled: !!id });
  const team = data?.team;

  if (isLoading) return <div className="max-w-4xl mx-auto px-4 py-8"><div className="card skeleton h-48" /></div>;
  if (!team) return <div className="text-center py-20">Team not found</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-24 lg:pb-8">
      <Link to="/teams" className="inline-flex items-center gap-2 text-[var(--color-text-muted)] hover:text-brand-400 mb-6 text-sm"><ArrowLeft size={14} /> All Teams</Link>
      <div className="card overflow-hidden mb-6">
        <div className="h-2 w-full" style={{ background: team.primaryColor }} />
        <div className="p-6 flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-2xl flex-shrink-0"
            style={{ background: team.primaryColor }}>
            {team.logo ? <img src={team.logo} className="w-full h-full object-cover rounded-2xl" /> : team.shortName.substring(0,2)}
          </div>
          <div>
            <h1 className="font-display font-bold text-3xl text-[var(--color-text)]">{team.name}</h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-[var(--color-text-muted)]">
              <span>{team.shortName}</span>
              {team.country && <span>• {team.country}</span>}
              {team.homeGround && <span>• {team.homeGround}</span>}
            </div>
          </div>
        </div>
      </div>

      <h2 className="font-bold text-lg mb-3">Players</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {team.players?.map((player: any) => (
          <Link key={player.id} to={`/players/${player.id}`} className="card p-3 flex items-center gap-3 hover:bg-[var(--color-surface-2)] transition-colors">
            <div className="w-10 h-10 rounded-full bg-brand-600/20 flex items-center justify-center font-bold text-brand-400 flex-shrink-0">
              {player.photo ? <img src={player.photo} className="w-full h-full object-cover rounded-full" /> : player.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-sm truncate">{player.name}</div>
              <div className="text-xs text-[var(--color-text-muted)]">{player.role?.replace(/_/g, ' ')}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
