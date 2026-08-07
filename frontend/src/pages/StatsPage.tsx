import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { statsService } from '../services/team.service';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatsPage() {
  const { data: battingData } = useQuery({ queryKey: ['batting-leaders-page'], queryFn: () => statsService.getBattingLeaders({ limit: '10' }) });
  const { data: bowlingData } = useQuery({ queryKey: ['bowling-leaders-page'], queryFn: () => statsService.getBowlingLeaders({ limit: '10' }) });

  const batters = battingData?.players || [];
  const bowlers = bowlingData?.players || [];

  const LeaderRow = ({ player, rank, stat, statLabel }: { player: any; rank: number; stat: string | number; statLabel: string }) => (
    <Link to={`/players/${player.id}`} className="flex items-center gap-3 p-3 hover:bg-[var(--color-surface-2)] transition-colors">
      <span className="text-sm font-bold text-[var(--color-text-muted)] w-6">{rank}</span>
      <div className="w-9 h-9 rounded-full bg-brand-600/20 flex items-center justify-center font-bold text-brand-400 text-sm flex-shrink-0">
        {player.photo ? <img src={player.photo} className="w-full h-full object-cover rounded-full" /> : player.name.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm text-[var(--color-text)] truncate">{player.name}</div>
        <div className="text-xs text-[var(--color-text-muted)]">{player.team?.shortName}</div>
      </div>
      <div className="text-right">
        <div className="font-display font-bold text-lg text-brand-400">{stat}</div>
        <div className="text-[10px] text-[var(--color-text-muted)]">{statLabel}</div>
      </div>
    </Link>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-24 lg:pb-8">
      <h1 className="font-display font-bold text-2xl mb-6">Statistics</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={18} className="text-brand-400" />
            <h2 className="font-bold text-lg">Batting Leaders</h2>
          </div>
          <div className="card divide-y divide-[var(--color-border)]">
            {batters.map((p: any, i: number) => <LeaderRow key={p.id} player={p} rank={i+1} stat={p.totalRuns} statLabel="runs" />)}
            {batters.length === 0 && <div className="p-6 text-center text-sm text-[var(--color-text-muted)]">No batting data yet</div>}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown size={18} className="text-green-400" />
            <h2 className="font-bold text-lg">Bowling Leaders</h2>
          </div>
          <div className="card divide-y divide-[var(--color-border)]">
            {bowlers.map((p: any, i: number) => <LeaderRow key={p.id} player={p} rank={i+1} stat={p.totalWickets} statLabel="wickets" />)}
            {bowlers.length === 0 && <div className="p-6 text-center text-sm text-[var(--color-text-muted)]">No bowling data yet</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
