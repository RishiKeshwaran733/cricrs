import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Radio, Trophy, Users, ArrowRight, TrendingUp, Calendar } from 'lucide-react';
import { matchService } from '../services/match.service';
import { teamService, statsService } from '../services/team.service';
import LiveScoreCard from '../components/match/LiveScoreCard';

const SkeletonCard = () => (
  <div className="card p-4 space-y-3">
    <div className="skeleton h-4 w-1/3" />
    <div className="skeleton h-8 w-2/3" />
    <div className="skeleton h-4 w-full" />
  </div>
);

const SectionHeader = ({ icon: Icon, title, to }: { icon: any; title: string; to?: string }) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-lg bg-brand-600/20 flex items-center justify-center">
        <Icon size={16} className="text-brand-400" />
      </div>
      <h2 className="font-display font-bold text-lg text-[var(--color-text)]">{title}</h2>
    </div>
    {to && (
      <Link to={to} className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors">
        View all <ArrowRight size={14} />
      </Link>
    )}
  </div>
);

export default function HomePage() {
  const { data: liveData, isLoading: liveLoading } = useQuery({
    queryKey: ['live-matches'],
    queryFn: matchService.getLiveMatches,
    refetchInterval: 10_000,
  });

  const { data: matchData } = useQuery({
    queryKey: ['matches-recent'],
    queryFn: () => matchService.getMatches({ limit: '6', status: 'COMPLETED' }),
  });

  const { data: upcomingData } = useQuery({
    queryKey: ['matches-upcoming'],
    queryFn: () => matchService.getMatches({ limit: '4', status: 'UPCOMING' }),
  });

  const { data: teamData } = useQuery({
    queryKey: ['teams-home'],
    queryFn: () => teamService.getTeams({ limit: '8' }),
  });

  const { data: battingData } = useQuery({
    queryKey: ['batting-leaders'],
    queryFn: () => statsService.getBattingLeaders({ limit: '5' }),
  });

  const liveMatches = liveData?.matches || [];
  const recentMatches = matchData?.matches || [];
  const upcomingMatches = upcomingData?.matches || [];
  const teams = teamData?.teams || [];
  const battingLeaders = battingData?.players || [];

  return (
    <div className="pb-20 lg:pb-0">
      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-hero-gradient">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-brand-400 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-2 mb-4">
              {liveMatches.length > 0 && <span className="live-badge"><span className="live-dot" />{liveMatches.length} Live</span>}
            </div>
            <h1 className="font-display font-bold text-4xl md:text-6xl text-white leading-tight mb-4">
              Cricket's Pulse,<br />
              <span className="text-brand-300">Live & Unfiltered</span>
            </h1>
            <p className="text-blue-200 text-lg md:text-xl mb-8 max-w-xl leading-relaxed">
              Ball-by-ball scoring, live commentary, and real-time stats. Your ultimate cricket companion.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/live"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors"
              >
                <Radio size={18} /> Watch Live
              </Link>
              <Link
                to="/tournaments"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold backdrop-blur transition-colors border border-white/20"
              >
                <Trophy size={18} /> Tournaments
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Live Matches */}
        <section className="mt-10">
          <SectionHeader icon={Radio} title="Live Matches" to="/live" />
          {liveLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : liveMatches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {liveMatches.map((match: any) => (
                <LiveScoreCard
                  key={match.id}
                  matchId={match.id}
                  teamA={match.teamA}
                  teamB={match.teamB}
                  innings={match.innings || []}
                  status={match.status}
                  resultText={match.resultText}
                  venue={match.venue}
                />
              ))}
            </div>
          ) : (
            <div className="card p-10 text-center">
              <div className="text-4xl mb-3">🏏</div>
              <p className="text-[var(--color-text-muted)]">No live matches at the moment</p>
              <Link to="/" className="mt-3 inline-block text-sm text-brand-400 hover:underline">Check upcoming matches</Link>
            </div>
          )}
        </section>

        {/* Upcoming + Recent in 2 cols */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upcoming */}
          <div className="lg:col-span-2">
            <SectionHeader icon={Calendar} title="Upcoming Matches" to="/live" />
            <div className="space-y-3">
              {upcomingMatches.length === 0 && (
                <div className="card p-6 text-center text-[var(--color-text-muted)] text-sm">No upcoming matches scheduled</div>
              )}
              {upcomingMatches.map((match: any) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="card p-4 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ background: match.teamA.primaryColor || '#1e293b' }}
                      >
                        {match.teamA.shortName.substring(0, 2)}
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{match.teamA.shortName} vs {match.teamB.shortName}</div>
                      <div className="text-xs text-[var(--color-text-muted)]">
                        {new Date(match.scheduledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {match.venue && ` • ${match.venue}`}
                      </div>
                    </div>
                  </div>
                  <Link to={`/matches/${match.id}`} className="text-xs text-brand-400 hover:underline flex-shrink-0">View →</Link>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Batting Leaders */}
          <div>
            <SectionHeader icon={TrendingUp} title="Top Batters" to="/stats" />
            <div className="card divide-y divide-[var(--color-border)]">
              {battingLeaders.length === 0 && (
                <div className="p-4 text-sm text-center text-[var(--color-text-muted)]">No stats yet</div>
              )}
              {battingLeaders.map((player: any, i: number) => (
                <Link key={player.id} to={`/players/${player.id}`} className="flex items-center gap-3 p-3 hover:bg-[var(--color-surface-2)] transition-colors">
                  <span className="text-sm font-bold text-[var(--color-text-muted)] w-5">{i + 1}</span>
                  <div className="w-8 h-8 rounded-full bg-brand-600/20 flex items-center justify-center text-brand-400 font-bold text-xs">
                    {player.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-[var(--color-text)] truncate">{player.name}</div>
                    <div className="text-xs text-[var(--color-text-muted)] truncate">{player.team?.shortName}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-display font-bold text-brand-400">{player.totalRuns}</div>
                    <div className="text-[10px] text-[var(--color-text-muted)]">runs</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Teams */}
        <section className="mt-10">
          <SectionHeader icon={Users} title="Teams" to="/teams" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {teams.map((team: any) => (
              <Link key={team.id} to={`/teams/${team.id}`} className="card card-hover flex flex-col items-center p-3 gap-2">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ background: team.primaryColor || '#1e293b' }}
                >
                  {team.logo ? (
                    <img src={team.logo} alt={team.name} className="w-full h-full object-cover rounded-full" />
                  ) : team.shortName.substring(0, 2)}
                </div>
                <span className="text-xs font-semibold text-center text-[var(--color-text)] leading-tight">{team.shortName}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
