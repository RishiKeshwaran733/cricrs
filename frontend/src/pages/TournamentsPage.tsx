import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { tournamentService } from '../services/team.service';
import { Trophy } from 'lucide-react';

export default function TournamentsPage() {
  const { data, isLoading } = useQuery({ queryKey: ['tournaments'], queryFn: () => tournamentService.getTournaments() });
  const tournaments = data?.tournaments || [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-24 lg:pb-8">
      <div className="flex items-center gap-3 mb-6">
        <Trophy size={24} className="text-brand-400" />
        <h1 className="font-display font-bold text-2xl">Tournaments</h1>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? [1,2,3].map(i => <div key={i} className="card skeleton h-48" />) :
          tournaments.map((t: any) => (
            <Link key={t.id} to={`/tournaments/${t.id}`} className="card card-hover p-5 flex flex-col gap-3 block">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-brand-600/20 flex items-center justify-center flex-shrink-0">
                  {t.logo ? <img src={t.logo} className="w-full h-full object-cover rounded-xl" /> : <Trophy size={20} className="text-brand-400" />}
                </div>
                <div>
                  <div className="font-bold text-[var(--color-text)]">{t.name}</div>
                  <div className="text-xs text-[var(--color-text-muted)]">{t.format}</div>
                </div>
              </div>
              <div className="flex gap-2 text-xs">
                <span className={`px-2 py-0.5 rounded-full font-semibold ${
                  t.status === 'ONGOING' ? 'bg-green-500/15 text-green-400' :
                  t.status === 'UPCOMING' ? 'bg-yellow-500/15 text-yellow-400' :
                  'bg-gray-500/15 text-gray-400'}`}>{t.status}</span>
                <span className="text-[var(--color-text-muted)]">{t.teams?.length || 0} teams • {t._count?.matches || 0} matches</span>
              </div>
              <div className="text-xs text-[var(--color-text-muted)]">
                {new Date(t.startDate).toLocaleDateString()} — {new Date(t.endDate).toLocaleDateString()}
              </div>
            </Link>
          ))
        }
      </div>
    </div>
  );
}
