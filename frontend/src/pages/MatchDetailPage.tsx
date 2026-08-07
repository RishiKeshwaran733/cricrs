import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Trophy } from 'lucide-react';
import { matchService } from '../services/match.service';
import { useLiveMatch } from '../hooks/useLiveMatch';
import ScorecardTable from '../components/match/ScorecardTable';
import CommentaryFeed from '../components/match/CommentaryFeed';
import RecentBalls from '../components/match/RecentBalls';

const TABS = ['Summary', 'Scorecard', 'Commentary', 'Statistics', 'Match Info'];

export default function MatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('Summary');

  const { data, isLoading, error } = useQuery({
    queryKey: ['match', id],
    queryFn: () => matchService.getMatch(id!),
    enabled: !!id,
    refetchInterval: 15_000,
  });

  const match = data?.match;
  const currentInnings = match?.innings?.[match.innings.length - 1];

  const { liveState } = useLiveMatch(id!, currentInnings?.id);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="card p-6 mb-4 skeleton h-40" />
        <div className="card p-6 skeleton h-96" />
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 text-center">
        <div className="text-5xl mb-4">🏏</div>
        <h2 className="text-xl font-bold mb-2">Match Not Found</h2>
        <p className="text-[var(--color-text-muted)]">This match doesn't exist or has been removed.</p>
      </div>
    );
  }

  const isLive = match.status === 'LIVE';

  // Build commentary items from balls
  const commentaryItems = match.innings?.flatMap((inn: any) =>
    (inn.balls || []).map((ball: any) => ({
      id: ball.id,
      over: `${ball.overNumber}.${ball.ballNumber}`,
      ball,
      commentary: ball.commentary || '',
    }))
  ) || [];

  const firstInnings = match.innings?.[0];
  const secondInnings = match.innings?.[1];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-24 lg:pb-6">
      {/* Match header card */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card overflow-hidden mb-4">
        <div className="h-2 w-full bg-gradient-to-r from-brand-600 to-brand-400" />
        <div className="p-5">
          {/* Status */}
          <div className="flex items-center gap-3 mb-4">
            {isLive && <span className="live-badge"><span className="live-dot" />LIVE</span>}
            {match.status === 'COMPLETED' && <span className="text-xs font-semibold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">COMPLETED</span>}
            {match.status === 'UPCOMING' && <span className="text-xs font-semibold text-[var(--color-text-muted)] bg-[var(--color-surface-2)] px-2 py-0.5 rounded-full">UPCOMING</span>}
            <span className="text-xs font-semibold text-brand-300 bg-brand-500/15 px-2 py-0.5 rounded-full">{match.format}</span>
            {match.tournament && (
              <span className="hidden sm:flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                <Trophy size={11} /> {match.tournament.name}
              </span>
            )}
          </div>

          {/* Teams & Scores */}
          <div className="grid grid-cols-5 gap-4 items-center">
            {/* Team A */}
            <div className="col-span-2 text-left">
              <div
                className="inline-flex w-16 h-16 rounded-2xl items-center justify-center text-white font-bold text-xl mb-2"
                style={{ background: match.teamA.primaryColor || '#1e293b' }}
              >
                {match.teamA.logo ? (
                  <img src={match.teamA.logo} alt={match.teamA.name} className="w-full h-full object-cover rounded-2xl" />
                ) : match.teamA.shortName.substring(0, 2)}
              </div>
              <div className="font-display font-bold text-lg text-[var(--color-text)]">{match.teamA.shortName}</div>
              <div className="text-xs text-[var(--color-text-muted)] mb-2">{match.teamA.name}</div>
              {firstInnings && firstInnings.battingTeam.id === match.teamA.id && (
                <div className="score-display font-display font-bold text-3xl text-[var(--color-text)]">
                  {firstInnings.totalRuns}/{firstInnings.totalWickets}
                  <div className="text-sm font-normal text-[var(--color-text-muted)]">
                    ({Math.floor(firstInnings.totalBalls / 6)}.{firstInnings.totalBalls % 6} ov)
                  </div>
                </div>
              )}
              {secondInnings && secondInnings.battingTeam.id === match.teamA.id && (
                <div className="score-display font-display font-bold text-3xl text-brand-400">
                  {secondInnings.totalRuns}/{secondInnings.totalWickets}
                  <div className="text-sm font-normal text-[var(--color-text-muted)]">
                    ({Math.floor(secondInnings.totalBalls / 6)}.{secondInnings.totalBalls % 6} ov)
                  </div>
                </div>
              )}
            </div>

            {/* VS */}
            <div className="col-span-1 text-center">
              <div className="text-2xl font-display font-bold text-[var(--color-text-muted)]">VS</div>
              {match.resultText && (
                <div className="mt-2 text-xs font-semibold text-green-400 text-center">{match.resultText}</div>
              )}
              {isLive && currentInnings?.target && (
                <div className="mt-2 text-xs text-center">
                  <div className="text-[var(--color-text-muted)]">Target</div>
                  <div className="font-bold text-orange-400 text-lg">{currentInnings.target}</div>
                </div>
              )}
            </div>

            {/* Team B */}
            <div className="col-span-2 text-right">
              <div
                className="inline-flex w-16 h-16 rounded-2xl items-center justify-center text-white font-bold text-xl mb-2 ml-auto"
                style={{ background: match.teamB.primaryColor || '#334155' }}
              >
                {match.teamB.logo ? (
                  <img src={match.teamB.logo} alt={match.teamB.name} className="w-full h-full object-cover rounded-2xl" />
                ) : match.teamB.shortName.substring(0, 2)}
              </div>
              <div className="font-display font-bold text-lg text-[var(--color-text)]">{match.teamB.shortName}</div>
              <div className="text-xs text-[var(--color-text-muted)] mb-2">{match.teamB.name}</div>
              {firstInnings && firstInnings.battingTeam.id === match.teamB.id && (
                <div className="score-display font-display font-bold text-3xl text-[var(--color-text)]">
                  {firstInnings.totalRuns}/{firstInnings.totalWickets}
                  <div className="text-sm font-normal text-[var(--color-text-muted)]">
                    ({Math.floor(firstInnings.totalBalls / 6)}.{firstInnings.totalBalls % 6} ov)
                  </div>
                </div>
              )}
              {secondInnings && secondInnings.battingTeam.id === match.teamB.id && (
                <div className="score-display font-display font-bold text-3xl text-brand-400">
                  {secondInnings.totalRuns}/{secondInnings.totalWickets}
                  <div className="text-sm font-normal text-[var(--color-text-muted)]">
                    ({Math.floor(secondInnings.totalBalls / 6)}.{secondInnings.totalBalls % 6} ov)
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Live stats bar */}
          {isLive && currentInnings && (
            <div className="mt-4 pt-3 border-t border-[var(--color-border)] flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-[var(--color-text-muted)]">CRR <strong className="text-brand-400">{liveState?.crr?.toFixed(2) || '0.00'}</strong></span>
                {liveState?.rrr && <span className="text-[var(--color-text-muted)]">RRR <strong className="text-orange-400">{liveState.rrr.toFixed(2)}</strong></span>}
              </div>
              <RecentBalls balls={currentInnings.balls || []} maxShow={6} />
            </div>
          )}

          {/* Venue & Date */}
          <div className="mt-3 flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
            {match.venue && <span className="flex items-center gap-1"><MapPin size={11} /> {match.venue}</span>}
            <span className="flex items-center gap-1">
              <Calendar size={11} />
              {new Date(match.scheduledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="tab-bar mb-4">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`tab-item ${activeTab === tab ? 'active' : ''}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="card p-4">
        {activeTab === 'Summary' && (
          <div>
            <h2 className="font-bold mb-3">Match Summary</h2>
            {match.innings?.map((inn: any) => (
              <div key={inn.id} className="mb-6">
                <h3 className="text-sm font-semibold text-brand-400 mb-2">{inn.battingTeam.name} Innings</h3>
                <ScorecardTable
                  batting={inn.battingCards || []}
                  bowling={inn.bowlingCards || []}
                  extras={{ total: inn.extras, wides: inn.wides, noBalls: inn.noBalls, byes: inn.byes, legByes: inn.legByes, penalty: inn.penalty }}
                  total={{ runs: inn.totalRuns, wickets: inn.totalWickets, overs: `${Math.floor(inn.totalBalls / 6)}.${inn.totalBalls % 6}` }}
                  fallOfWickets={inn.fallOfWickets || []}
                />
              </div>
            ))}
          </div>
        )}

        {activeTab === 'Scorecard' && (
          <div>
            {match.innings?.map((inn: any) => (
              <div key={inn.id} className="mb-6">
                <h3 className="text-sm font-semibold text-brand-400 mb-2">{inn.battingTeam.name} Innings</h3>
                <ScorecardTable
                  batting={inn.battingCards || []}
                  bowling={inn.bowlingCards || []}
                  extras={{ total: inn.extras, wides: inn.wides, noBalls: inn.noBalls, byes: inn.byes, legByes: inn.legByes, penalty: inn.penalty }}
                  total={{ runs: inn.totalRuns, wickets: inn.totalWickets, overs: `${Math.floor(inn.totalBalls / 6)}.${inn.totalBalls % 6}` }}
                  fallOfWickets={inn.fallOfWickets || []}
                />
              </div>
            ))}
          </div>
        )}

        {activeTab === 'Commentary' && (
          <CommentaryFeed items={commentaryItems} />
        )}

        {activeTab === 'Statistics' && (
          <div className="space-y-4">
            <h3 className="font-bold">Match Statistics</h3>
            {match.innings?.map((inn: any) => (
              <div key={inn.id} className="space-y-2">
                <h4 className="text-sm font-semibold text-brand-400">{inn.battingTeam.name}</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Total Runs', value: inn.totalRuns },
                    { label: 'Wickets', value: inn.totalWickets },
                    { label: 'Extras', value: inn.extras },
                    { label: 'Powerplay', value: `${inn.powerplayRuns}/${inn.powerplayWickets}` },
                  ].map(s => (
                    <div key={s.label} className="bg-[var(--color-surface-2)] rounded-xl p-3">
                      <div className="text-xs text-[var(--color-text-muted)]">{s.label}</div>
                      <div className="font-display font-bold text-xl text-[var(--color-text)] mt-1">{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'Match Info' && (
          <div className="space-y-3">
            <h3 className="font-bold mb-3">Match Information</h3>
            {[
              { label: 'Format', value: match.format },
              { label: 'Venue', value: match.venue || '—' },
              { label: 'Date', value: new Date(match.scheduledAt).toLocaleString() },
              { label: 'Toss', value: match.tossWinner ? `${match.tossWinner.name} won, elected to ${match.tossDecision?.toLowerCase()}` : '—' },
              { label: 'Umpire 1', value: match.umpire1 || '—' },
              { label: 'Umpire 2', value: match.umpire2 || '—' },
              { label: 'Third Umpire', value: match.thirdUmpire || '—' },
              { label: 'Match Referee', value: match.matchReferee || '—' },
              { label: 'Scorer', value: match.scorer || '—' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between py-2 border-b border-[var(--color-border)] text-sm">
                <span className="text-[var(--color-text-muted)]">{label}</span>
                <span className="font-medium text-[var(--color-text)]">{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
