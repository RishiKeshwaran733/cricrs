import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { tournamentService } from '../services/team.service';
import { ArrowLeft } from 'lucide-react';
import LiveScoreCard from '../components/match/LiveScoreCard';

export default function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<'fixtures' | 'points'>('fixtures');
  const { data, isLoading } = useQuery({ queryKey: ['tournament', id], queryFn: () => tournamentService.getTournament(id!), enabled: !!id });
  const { data: ptData } = useQuery({ queryKey: ['points-table', id], queryFn: () => tournamentService.getPointsTable(id!), enabled: !!id });

  const t = data?.tournament;
  const pointsTable = ptData?.entries || [];

  if (isLoading) return <div className="max-w-5xl mx-auto px-4 py-8"><div className="card skeleton h-40" /></div>;
  if (!t) return <div className="text-center py-20">Tournament not found</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pb-24 lg:pb-8">
      <Link to="/tournaments" className="inline-flex items-center gap-2 text-[var(--color-text-muted)] hover:text-brand-400 mb-6 text-sm"><ArrowLeft size={14} /> Tournaments</Link>
      <div className="card p-5 mb-6">
        <h1 className="font-display font-bold text-2xl mb-1">{t.name}</h1>
        <p className="text-sm text-[var(--color-text-muted)]">{t.format} • {t.teams?.length} Teams • {new Date(t.startDate).toLocaleDateString()} – {new Date(t.endDate).toLocaleDateString()}</p>
      </div>

      <div className="tab-bar mb-4">
        {['fixtures', 'points'].map(tab2 => (
          <button key={tab2} onClick={() => setTab(tab2 as any)} className={`tab-item ${tab === tab2 ? 'active' : ''} capitalize`}>{tab2 === 'points' ? 'Points Table' : 'Fixtures'}</button>
        ))}
      </div>

      {tab === 'fixtures' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {t.matches?.map((match: any) => (
            <LiveScoreCard key={match.id} matchId={match.id} teamA={match.teamA} teamB={match.teamB}
              innings={match.innings || []} status={match.status} resultText={match.resultText} venue={match.venue} />
          ))}
          {(!t.matches || t.matches.length === 0) && <div className="col-span-2 text-center text-[var(--color-text-muted)] py-10">No matches yet</div>}
        </div>
      )}

      {tab === 'points' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-[var(--color-border)]">
                <tr className="text-xs text-[var(--color-text-muted)] uppercase">
                  {['#', 'Team', 'P', 'W', 'L', 'T', 'NR', 'Pts', 'NRR'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {pointsTable.map((entry: any, i: number) => (
                  <tr key={entry.id} className={i < 4 ? 'bg-brand-500/5' : ''}>
                    <td className="px-4 py-3 font-bold text-[var(--color-text-muted)]">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[var(--color-text)]">{entry.team.name}</div>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-muted)]">{entry.played}</td>
                    <td className="px-4 py-3 text-green-400">{entry.won}</td>
                    <td className="px-4 py-3 text-red-400">{entry.lost}</td>
                    <td className="px-4 py-3">{entry.tied}</td>
                    <td className="px-4 py-3">{entry.noResult}</td>
                    <td className="px-4 py-3 font-bold text-brand-400">{entry.points}</td>
                    <td className="px-4 py-3 text-[var(--color-text-muted)]">{entry.nrr > 0 ? '+' : ''}{entry.nrr.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
