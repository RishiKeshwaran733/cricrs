import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Undo2, Redo2, Pause, Play, SkipForward, StopCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { matchService } from '../../services/match.service';
import RecentBalls from '../match/RecentBalls';

const RUN_BUTTONS = [0, 1, 2, 3, 4, 5, 6] as const;

const EXTRAS = [
  { label: 'Wide', value: 'WIDE', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40 hover:bg-purple-500/30' },
  { label: 'No Ball', value: 'NO_BALL', color: 'bg-orange-500/20 text-orange-300 border-orange-500/40 hover:bg-orange-500/30' },
  { label: 'Bye', value: 'BYE', color: 'bg-teal-500/20 text-teal-300 border-teal-500/40 hover:bg-teal-500/30' },
  { label: 'Leg Bye', value: 'LEG_BYE', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/30' },
  { label: 'Dead Ball', value: 'DEAD_BALL', color: 'bg-gray-500/20 text-gray-300 border-gray-500/40 hover:bg-gray-500/30' },
  { label: 'Penalty', value: 'PENALTY', color: 'bg-pink-500/20 text-pink-300 border-pink-500/40 hover:bg-pink-500/30' },
] as const;

const WICKET_TYPES = [
  { label: 'Bowled', value: 'BOWLED' },
  { label: 'Caught', value: 'CAUGHT' },
  { label: 'LBW', value: 'LBW' },
  { label: 'Run Out', value: 'RUN_OUT' },
  { label: 'Stumped', value: 'STUMPED' },
  { label: 'Hit Wicket', value: 'HIT_WICKET' },
  { label: 'Retired Hurt', value: 'RETIRED_HURT' },
  { label: 'Obstructing', value: 'OBSTRUCTING_FIELD' },
  { label: 'Handled Ball', value: 'HANDLED_BALL' },
  { label: 'Hit Ball 2x', value: 'HIT_BALL_TWICE' },
  { label: 'Timed Out', value: 'TIMED_OUT' },
] as const;

const RUN_COLORS: Record<number, string> = {
  0: 'bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:bg-[var(--color-surface)]',
  1: 'bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)] hover:bg-[var(--color-surface-2)]',
  2: 'bg-green-500/15 text-green-300 border-green-500/35 hover:bg-green-500/25',
  3: 'bg-green-500/20 text-green-200 border-green-500/40 hover:bg-green-500/30',
  4: 'bg-blue-500/20 text-blue-200 border-blue-500/40 hover:bg-blue-500/30',
  5: 'bg-blue-500/15 text-blue-300 border-blue-500/30 hover:bg-blue-500/25',
  6: 'bg-yellow-500/20 text-yellow-200 border-yellow-500/40 hover:bg-yellow-500/30',
};

interface ScoringPanelProps {
  matchId: string;
  inningsId: string;
  innings: any;
  players: { batters: any[]; bowlers: any[] };
  onRefresh: () => void;
  onEndInnings: () => void;
  onEndMatch: () => void;
  onPause: () => void;
  onResume: () => void;
  matchStatus: string;
}

export default function ScoringPanel({
  matchId, inningsId, innings, players, onRefresh, onEndInnings, onEndMatch, onPause, onResume, matchStatus
}: ScoringPanelProps) {
  const [selectedExtra, setSelectedExtra] = useState<string | null>(null);
  const [showWicket, setShowWicket] = useState(false);
  const [wicketType, setWicketType] = useState<string | null>(null);
  const [extrasRuns, setExtrasRuns] = useState(0);
  const [dismissedBatterId, setDismissedBatterId] = useState<string>('');
  const [fielderId, setFielderId] = useState<string>('');
  const [lastBallId, setLastBallId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [balls, setBalls] = useState<any[]>(innings?.balls || []);

  const currentBatter = players.batters.find(p => p.id === innings?.currentBatterId);
  const currentNonStriker = players.batters.find(p => p.id === innings?.currentNonStrikerId);
  const currentBowler = players.bowlers.find(p => p.id === innings?.currentBowlerId);

  const overNumber = Math.floor((innings?.totalBalls || 0) / 6);
  const ballInOver = ((innings?.totalBalls || 0) % 6) + 1;

  const handleRun = async (runs: number) => {
    if (!innings?.currentBatterId || !innings?.currentBowlerId) {
      toast.error('Please set current batter and bowler first');
      return;
    }
    setSubmitting(true);
    try {
      if (showWicket && !wicketType) {
        toast.error('Please select a wicket type');
        setSubmitting(false);
        return;
      }

      const ballType = selectedExtra || 'NORMAL';
      const isWicket = showWicket && !!wicketType;

      const result = await matchService.addBall({
        inningsId,
        overNumber,
        ballNumber: ballInOver,
        ballType,
        runsScored: ballType === 'WIDE' || ballType === 'NO_BALL' || ballType === 'BYE' || ballType === 'LEG_BYE' || ballType === 'DEAD_BALL' ? 0 : runs,
        extrasRuns: selectedExtra ? (extrasRuns || (ballType === 'WIDE' || ballType === 'NO_BALL' ? 1 : 0)) : 0,
        isWicket,
        wicketType: isWicket ? wicketType : undefined,
        dismissedBatterId: isWicket ? (dismissedBatterId || innings.currentBatterId) : undefined,
        fielderId: fielderId || undefined,
        batterId: innings.currentBatterId,
        nonStrikerId: innings.currentNonStrikerId,
        bowlerId: innings.currentBowlerId,
      });

      setLastBallId(result.ball.id);
      setBalls(prev => [...prev, result.ball]);
      setSelectedExtra(null);
      setShowWicket(false);
      setWicketType(null);
      setExtrasRuns(0);
      setFielderId('');
      setDismissedBatterId('');
      onRefresh();

      const label = isWicket ? '🏏 WICKET!' : runs === 6 ? '⚡ SIX!' : runs === 4 ? '🎯 FOUR!' : `✅ ${runs} run${runs !== 1 ? 's' : ''} scored`;
      toast.success(label);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to add ball');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUndo = async () => {
    if (!lastBallId) { toast.error('No ball to undo'); return; }
    try {
      await matchService.undoBall(lastBallId);
      setLastBallId(null);
      onRefresh();
      toast.success('Ball undone');
    } catch {
      toast.error('Failed to undo');
    }
  };

  return (
    <div className="space-y-4">
      {/* Live Score Header */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-3xl font-display font-bold gradient-text">
              {innings?.totalRuns}/{innings?.totalWickets}
            </div>
            <div className="text-sm text-[var(--color-text-muted)] mt-0.5">
              {Math.floor((innings?.totalBalls || 0) / 6)}.{(innings?.totalBalls || 0) % 6} overs
              {innings?.target && <span className="ml-2 text-orange-400">Target: {innings.target}</span>}
            </div>
          </div>
          <div className="text-right text-sm">
            <div>Over {overNumber + 1}, Ball {ballInOver}</div>
            <div className="text-[var(--color-text-muted)]">
              {innings?.extras} extras
            </div>
          </div>
        </div>

        {/* Current players */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
          <div className="bg-[var(--color-surface-2)] rounded-lg p-3 sm:p-2 border border-transparent hover:border-[var(--color-border)] transition-colors">
            <div className="text-[10px] text-[var(--color-text-muted)] uppercase font-semibold mb-1">On Strike</div>
            <div className="font-semibold text-[var(--color-text)] truncate text-base sm:text-sm">{currentBatter?.name || 'Not set'}</div>
          </div>
          <div className="bg-[var(--color-surface-2)] rounded-lg p-3 sm:p-2 border border-transparent hover:border-[var(--color-border)] transition-colors">
            <div className="text-[10px] text-[var(--color-text-muted)] uppercase font-semibold mb-1">Non-Striker</div>
            <div className="font-semibold text-[var(--color-text)] truncate text-base sm:text-sm">{currentNonStriker?.name || 'Not set'}</div>
          </div>
          <div className="bg-[var(--color-surface-2)] rounded-lg p-3 sm:p-2 border border-[var(--color-border)]">
            <div className="text-[10px] text-[var(--color-text-muted)] uppercase font-semibold mb-1 flex items-center justify-between">
              Bowler
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
            </div>
            <div className="font-semibold text-[var(--color-text)] truncate text-base sm:text-sm">{currentBowler?.name || 'Not set'}</div>
          </div>
        </div>

        {/* Recent balls */}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-[var(--color-text-muted)]">Recent:</span>
          <RecentBalls balls={balls} maxShow={8} />
        </div>
      </div>

      {/* Extras selector */}
      <div className="card p-4">
        <h3 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wide mb-3">Extras</h3>
        <div className="flex flex-wrap gap-2">
          {EXTRAS.map(e => (
            <button
              key={e.value}
              onClick={() => setSelectedExtra(selectedExtra === e.value ? null : e.value)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${e.color} ${
                selectedExtra === e.value ? 'ring-2 ring-white/30 scale-105' : ''
              }`}
            >
              {e.label}
            </button>
          ))}
        </div>

        {selectedExtra && selectedExtra !== 'DEAD_BALL' && (
          <div className="mt-3">
            <label className="text-xs text-[var(--color-text-muted)]">Extra runs ({selectedExtra})</label>
            <input
              type="number"
              min={0}
              max={10}
              value={extrasRuns}
              onChange={e => setExtrasRuns(Number(e.target.value))}
              className="mt-1 w-24 px-2 py-1 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)] text-sm"
            />
          </div>
        )}
      </div>

      {/* Wicket toggle */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wide">Wicket</h3>
          <button
            onClick={() => setShowWicket(!showWicket)}
            className={`px-4 py-1.5 rounded-lg border text-sm font-bold transition-all ${
              showWicket
                ? 'bg-red-500 text-white border-red-500'
                : 'bg-red-500/15 text-red-400 border-red-500/40 hover:bg-red-500/25'
            }`}
          >
            {showWicket ? '🏏 WICKET ON' : 'Mark Wicket'}
          </button>
        </div>

        <AnimatePresence>
          {showWicket && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-3 overflow-hidden"
            >
              <div className="flex flex-wrap gap-2">
                {WICKET_TYPES.map(wt => (
                  <button
                    key={wt.value}
                    onClick={() => setWicketType(wt.value)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                      wicketType === wt.value
                        ? 'bg-red-500 text-white border-red-500'
                        : 'bg-red-500/10 text-red-300 border-red-500/30 hover:bg-red-500/20'
                    }`}
                  >
                    {wt.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[var(--color-text-muted)]">Dismissed Batter</label>
                  <select
                    value={dismissedBatterId}
                    onChange={e => setDismissedBatterId(e.target.value)}
                    className="mt-1 w-full px-2 py-1.5 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)] text-sm"
                  >
                    <option value="">Select batter</option>
                    {players.batters.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[var(--color-text-muted)]">Fielder (optional)</label>
                  <select
                    value={fielderId}
                    onChange={e => setFielderId(e.target.value)}
                    className="mt-1 w-full px-2 py-1.5 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)] text-sm"
                  >
                    <option value="">Select fielder</option>
                    {players.bowlers.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {wicketType && (
                <button
                  onClick={() => handleRun(0)}
                  disabled={submitting}
                  className="mt-4 w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? 'Submitting...' : 'Submit Wicket (0 Runs)'}
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Run buttons */}
      <div className="card p-4">
        <h3 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wide mb-3">Score Runs</h3>
        <div className="grid grid-cols-7 gap-2">
          {RUN_BUTTONS.map(run => (
            <motion.button
              key={run}
              onClick={() => handleRun(run)}
              disabled={submitting}
              whileTap={{ scale: 0.93 }}
              className={`run-btn border ${RUN_COLORS[run]} ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {run}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Control actions */}
      <div className="card p-4">
        <h3 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wide mb-3">Match Controls</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleUndo}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] border border-[var(--color-border)] text-sm transition-colors"
          >
            <Undo2 size={14} /> Undo
          </button>

          {matchStatus === 'LIVE' ? (
            <button
              onClick={onPause}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-yellow-500/15 text-yellow-300 border border-yellow-500/35 hover:bg-yellow-500/25 text-sm transition-colors"
            >
              <Pause size={14} /> Pause
            </button>
          ) : (
            <button
              onClick={onResume}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-500/15 text-green-300 border border-green-500/35 hover:bg-green-500/25 text-sm transition-colors"
            >
              <Play size={14} /> Resume
            </button>
          )}

          <button
            onClick={onRefresh}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--color-surface-2)] text-brand-400 border border-brand-500/30 hover:bg-brand-500/10 text-sm transition-colors"
          >
            <RefreshCw size={14} /> Refresh
          </button>

          <button
            onClick={onEndInnings}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-orange-500/15 text-orange-300 border border-orange-500/35 hover:bg-orange-500/25 text-sm transition-colors"
          >
            <SkipForward size={14} /> End Innings
          </button>

          <button
            onClick={onEndMatch}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/15 text-red-300 border border-red-500/35 hover:bg-red-500/25 text-sm transition-colors"
          >
            <StopCircle size={14} /> End Match
          </button>
        </div>
      </div>
    </div>
  );
}
