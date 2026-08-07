import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import RecentBalls from './RecentBalls';

interface Team {
  id: string;
  name: string;
  shortName: string;
  logo?: string;
  primaryColor?: string;
}

interface Innings {
  id: string;
  battingTeam: Team;
  totalRuns: number;
  totalWickets: number;
  totalBalls: number;
  overs?: number;
  target?: number;
  balls?: any[];
}

interface LiveScoreCardProps {
  matchId: string;
  teamA: Team;
  teamB: Team;
  innings: Innings[];
  status: string;
  resultText?: string;
  crr?: number;
  rrr?: number;
  venue?: string;
}

const TeamLogo = ({ team, size = 40 }: { team: Team; size?: number }) => (
  <div
    className="rounded-full flex items-center justify-center font-display font-bold text-white flex-shrink-0"
    style={{
      width: size,
      height: size,
      background: team.primaryColor || '#1e293b',
      fontSize: size * 0.35,
    }}
  >
    {team.logo ? (
      <img src={team.logo} alt={team.name} className="w-full h-full object-cover rounded-full" />
    ) : (
      team.shortName.substring(0, 2)
    )}
  </div>
);

export default function LiveScoreCard({
  matchId, teamA, teamB, innings, status, resultText, crr, rrr, venue,
}: LiveScoreCardProps) {
  const currentInnings = innings[innings.length - 1];
  const firstInnings = innings[0];

  const isLive = status === 'LIVE';
  const isCompleted = status === 'COMPLETED';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="card card-hover overflow-hidden"
    >
      {/* Status bar */}
      <div className="h-1 w-full" style={{ background: isLive ? '#ef4444' : isCompleted ? '#22c55e' : '#64748b' }} />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {isLive && <span className="live-badge"><span className="live-dot" />LIVE</span>}
            {isCompleted && <span className="text-xs font-semibold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">COMPLETED</span>}
            {!isLive && !isCompleted && <span className="text-xs font-semibold text-[var(--color-text-muted)] bg-[var(--color-surface-2)] px-2 py-0.5 rounded-full uppercase">{status}</span>}
          </div>
          {venue && <p className="text-xs text-[var(--color-text-muted)] truncate max-w-[120px]">{venue}</p>}
        </div>

        {/* Teams and score */}
        <div className="space-y-2">
          {/* Team A */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <TeamLogo team={teamA} size={36} />
              <span className="font-semibold text-sm">{teamA.shortName}</span>
            </div>
            <div className="text-right">
              {firstInnings && firstInnings.battingTeam.id === teamA.id ? (
                <span className="score-display font-display font-bold text-lg">
                  {firstInnings.totalRuns}/{firstInnings.totalWickets}
                  <span className="text-xs text-[var(--color-text-muted)] font-normal ml-1">
                    ({Math.floor(firstInnings.totalBalls / 6)}.{firstInnings.totalBalls % 6})
                  </span>
                </span>
              ) : innings.length > 1 && innings[1].battingTeam.id === teamA.id ? (
                <div>
                  <span className="score-display font-display font-bold text-lg text-brand-400">
                    {innings[1].totalRuns}/{innings[1].totalWickets}
                    <span className="text-xs text-[var(--color-text-muted)] font-normal ml-1">
                      ({Math.floor(innings[1].totalBalls / 6)}.{innings[1].totalBalls % 6})
                    </span>
                  </span>
                  {firstInnings && <div className="text-xs text-[var(--color-text-muted)]">{firstInnings.totalRuns}/{firstInnings.totalWickets}</div>}
                </div>
              ) : (
                <span className="text-[var(--color-text-muted)] text-sm">Yet to bat</span>
              )}
            </div>
          </div>

          {/* Team B */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <TeamLogo team={teamB} size={36} />
              <span className="font-semibold text-sm">{teamB.shortName}</span>
            </div>
            <div className="text-right">
              {firstInnings && firstInnings.battingTeam.id === teamB.id ? (
                <span className="score-display font-display font-bold text-lg">
                  {firstInnings.totalRuns}/{firstInnings.totalWickets}
                  <span className="text-xs text-[var(--color-text-muted)] font-normal ml-1">
                    ({Math.floor(firstInnings.totalBalls / 6)}.{firstInnings.totalBalls % 6})
                  </span>
                </span>
              ) : innings.length > 1 && innings[1].battingTeam.id === teamB.id ? (
                <div>
                  <span className="score-display font-display font-bold text-lg text-brand-400">
                    {innings[1].totalRuns}/{innings[1].totalWickets}
                    <span className="text-xs text-[var(--color-text-muted)] font-normal ml-1">
                      ({Math.floor(innings[1].totalBalls / 6)}.{innings[1].totalBalls % 6})
                    </span>
                  </span>
                  {firstInnings && <div className="text-xs text-[var(--color-text-muted)]">{firstInnings.totalRuns}/{firstInnings.totalWickets}</div>}
                </div>
              ) : (
                <span className="text-[var(--color-text-muted)] text-sm">Yet to bat</span>
              )}
            </div>
          </div>
        </div>

        {/* Live stats */}
        {isLive && currentInnings && (
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
              <span>CRR <strong className="text-brand-400">{crr?.toFixed(2)}</strong></span>
              {rrr && <span>RRR <strong className="text-orange-400">{rrr.toFixed(2)}</strong></span>}
              {currentInnings.target && <span>Target <strong className="text-[var(--color-text)]">{currentInnings.target}</strong></span>}
            </div>
            {currentInnings.balls && <RecentBalls balls={currentInnings.balls} maxShow={6} />}
          </div>
        )}

        {/* Result */}
        {resultText && (
          <p className="mt-2 text-xs font-semibold text-green-400 bg-green-400/10 rounded-lg px-3 py-1.5">{resultText}</p>
        )}

        {/* View match link */}
        <Link
          to={`/matches/${matchId}`}
          className="mt-3 block text-center text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors"
        >
          Full Scorecard →
        </Link>
      </div>
    </motion.div>
  );
}
