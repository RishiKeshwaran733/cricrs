import { useQuery } from '@tanstack/react-query';
import { matchService } from '../services/match.service';
import LiveScoreCard from '../components/match/LiveScoreCard';
import { Radio } from 'lucide-react';

export default function LiveMatchesPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['live-matches-page'],
    queryFn: matchService.getLiveMatches,
    refetchInterval: 10_000,
  });

  const matches = data?.matches || [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-24 lg:pb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center">
          <Radio size={18} className="text-red-400" />
        </div>
        <div>
          <h1 className="font-display font-bold text-2xl">Live Matches</h1>
          <p className="text-sm text-[var(--color-text-muted)]">{matches.length} matches live right now</p>
        </div>
        <button onClick={() => refetch()} className="ml-auto text-sm text-brand-400 hover:underline">Refresh</button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="card skeleton h-40" />)}
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🏏</div>
          <h2 className="text-xl font-bold mb-2">No Live Matches</h2>
          <p className="text-[var(--color-text-muted)]">Check back soon. Live scores will appear here automatically.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {matches.map((match: any) => (
            <LiveScoreCard key={match.id} matchId={match.id} teamA={match.teamA} teamB={match.teamB}
              innings={match.innings || []} status={match.status} resultText={match.resultText} venue={match.venue} />
          ))}
        </div>
      )}
    </div>
  );
}
