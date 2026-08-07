import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { playerService } from '../services/team.service';

export default function PlayerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useQuery({ queryKey: ['player', id], queryFn: () => playerService.getPlayer(id!), enabled: !!id });
  const player = data?.player;

  if (isLoading) return <div className="max-w-4xl mx-auto px-4 py-8"><div className="card skeleton h-48" /></div>;
  if (!player) return <div className="text-center py-20">Player not found</div>;

  const stats = [
    { label: 'Matches', value: player.totalMatches },
    { label: 'Runs', value: player.totalRuns },
    { label: 'Highest', value: player.highestScore },
    { label: 'Average', value: player.battingAvg?.toFixed(1) || '0.0' },
    { label: 'Strike Rate', value: player.strikeRate?.toFixed(1) || '0.0' },
    { label: 'Fours', value: player.totalFours },
    { label: 'Sixes', value: player.totalSixes },
    { label: 'Wickets', value: player.totalWickets },
    { label: 'Economy', value: player.economy?.toFixed(1) || '0.0' },
    { label: 'Catches', value: player.totalCatches },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-24 lg:pb-8">
      <Link to="/players" className="inline-flex items-center gap-2 text-[var(--color-text-muted)] hover:text-brand-400 mb-6 text-sm"><ArrowLeft size={14} /> All Players</Link>
      <div className="card overflow-hidden mb-6">
        <div className="h-32 bg-hero-gradient" />
        <div className="px-6 pb-6">
          <div className="-mt-12 flex items-end gap-4 mb-4">
            <div className="w-24 h-24 rounded-2xl border-4 border-[var(--color-surface)] bg-brand-600/20 flex items-center justify-center font-bold text-3xl text-brand-400">
              {player.photo ? <img src={player.photo} className="w-full h-full object-cover rounded-2xl" /> : player.name.charAt(0)}
            </div>
            <div>
              <h1 className="font-display font-bold text-2xl text-[var(--color-text)]">{player.name}</h1>
              <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] mt-1">
                <span className="text-brand-400">{player.team?.name}</span>
                {player.nationality && <span>• {player.nationality}</span>}
                {player.jerseyNumber && <span>• #{player.jerseyNumber}</span>}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="text-xs bg-brand-500/15 text-brand-400 px-2 py-0.5 rounded-full">{player.role?.replace(/_/g, ' ')}</span>
            <span className="text-xs bg-[var(--color-surface-2)] text-[var(--color-text-muted)] px-2 py-0.5 rounded-full">{player.battingStyle?.replace(/_/g, ' ')}</span>
            {player.bowlingStyle !== 'NONE' && (
              <span className="text-xs bg-[var(--color-surface-2)] text-[var(--color-text-muted)] px-2 py-0.5 rounded-full">{player.bowlingStyle?.replace(/_/g, ' ')}</span>
            )}
          </div>
        </div>
      </div>

      <h2 className="font-bold text-lg mb-3">Career Statistics</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {stats.map(s => (
          <div key={s.label} className="card p-3 text-center">
            <div className="font-display font-bold text-2xl text-[var(--color-text)]">{s.value}</div>
            <div className="text-xs text-[var(--color-text-muted)] mt-1">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
