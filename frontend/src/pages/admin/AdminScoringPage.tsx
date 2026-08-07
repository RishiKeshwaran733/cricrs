import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import { matchService } from '../../services/match.service';
import { playerService } from '../../services/team.service';
import ScoringPanel from '../../components/scoring/ScoringPanel';
import ScorecardTable from '../../components/match/ScorecardTable';

export default function AdminScoringPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'score' | 'card'>('score');

  const { data: matchData, refetch: refetchMatch } = useQuery({
    queryKey: ['scoring-match', matchId],
    queryFn: () => matchService.getMatch(matchId!),
    enabled: !!matchId,
    refetchInterval: 5_000,
  });

  const match = matchData?.match;
  const currentInnings = match?.innings?.[match.innings.length - 1];

  const { data: playersData } = useQuery({
    queryKey: ['scoring-players', match?.teamA?.id, match?.teamB?.id],
    queryFn: async () => {
      const [a, b] = await Promise.all([
        playerService.getPlayers({ teamId: match.teamA.id, limit: '50', includeGuests: 'true' }),
        playerService.getPlayers({ teamId: match.teamB.id, limit: '50', includeGuests: 'true' }),
      ]);
      return { all: [...(a.players || []), ...(b.players || [])] };
    },
    enabled: !!match,
  });

  const allPlayers = playersData?.all || [];
  const battingTeamId = currentInnings?.battingTeamId;
  const bowlingTeamId = currentInnings?.bowlingTeamId;
  const batters = allPlayers.filter((p: any) => p.teamId === battingTeamId);
  const bowlers = allPlayers.filter((p: any) => p.teamId === bowlingTeamId);

  const handleSetPlayers = async (type: 'batter' | 'nonStriker' | 'bowler', playerId: string) => {
    if (!currentInnings) return;
    const updates: any = {};
    if (type === 'batter') updates.currentBatterId = playerId;
    if (type === 'nonStriker') updates.currentNonStrikerId = playerId;
    if (type === 'bowler') updates.currentBowlerId = playerId;
    try {
      await matchService.setCurrentPlayers(currentInnings.id, updates);
      qc.invalidateQueries({ queryKey: ['scoring-match'] });
    } catch { toast.error('Failed to set player'); }
  };

  const handleRenamePlayer = async (playerId: string, currentName: string) => {
    const newName = prompt(`Rename ${currentName} to:`, currentName);
    if (!newName || newName === currentName) return;
    try {
      await playerService.renameGuestPlayer(playerId, newName);
      toast.success('Player renamed');
      qc.invalidateQueries({ queryKey: ['scoring-players'] });
      qc.invalidateQueries({ queryKey: ['scoring-match'] });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to rename');
    }
  };

  const handleEndInnings = async () => {
    if (!currentInnings || !match) return;
    const isBowlingTeamId = currentInnings.bowlingTeamId;
    const battingTeam2Id = isBowlingTeamId;
    const bowlingTeam2Id = currentInnings.battingTeamId;
    try {
      await matchService.endInnings(matchId!, { inningsId: currentInnings.id, battingTeamId: battingTeam2Id, bowlingTeamId: bowlingTeam2Id });
      toast.success('Innings ended, 2nd innings started');
      qc.invalidateQueries({ queryKey: ['scoring-match'] });
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.message || e.message || 'Failed to end innings');
    }
  };

  const handleEndMatch = async () => {
    const resultText = 'Match ended manually';
    try {
      await matchService.endMatch(matchId!, { resultText });
      toast.success('Match ended');
      navigate('/admin/matches');
    } catch { toast.error('Failed to end match'); }
  };

  const handlePause = async () => {
    try { await matchService.pauseMatch(matchId!); toast.success('Match paused'); qc.invalidateQueries({ queryKey: ['scoring-match'] }); }
    catch { toast.error('Failed'); }
  };

  const handleResume = async () => {
    try { await matchService.resumeMatch(matchId!); toast.success('Match resumed'); qc.invalidateQueries({ queryKey: ['scoring-match'] }); }
    catch { toast.error('Failed'); }
  };

  if (!match) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin/matches')} className="p-2 rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-text-muted)]">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="font-display font-bold text-xl">{match.teamA.shortName} vs {match.teamB.shortName}</h1>
          <p className="text-sm text-[var(--color-text-muted)]">Live Scoring Panel • {match.format} • {match.status}</p>
        </div>
        <div className={`ml-auto px-3 py-1 rounded-full text-xs font-bold ${match.status === 'LIVE' ? 'bg-red-500/15 text-red-400' : 'bg-yellow-500/15 text-yellow-400'}`}>
          {match.status}
          {match.status === 'LIVE' && <span className="ml-1 inline-block w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />}
        </div>
      </div>

      {/* Set current players */}
      {currentInnings && (
        <div className="card p-4">
          <h3 className="text-xs font-bold uppercase text-[var(--color-text-muted)] mb-3">Set Current Players</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: 'On Strike (Batter)', type: 'batter' as const, options: batters },
              { label: 'Non-Striker', type: 'nonStriker' as const, options: batters },
              { label: 'Current Bowler', type: 'bowler' as const, options: bowlers },
            ].map(({ label, type, options }) => {
              const currentId = type === 'batter' ? currentInnings.currentBatterId : type === 'nonStriker' ? currentInnings.currentNonStrikerId : currentInnings.currentBowlerId;
              const currentPlayer = options.find((p: any) => p.id === currentId);
              return (
                <div key={type}>
                  <label className="block text-xs text-[var(--color-text-muted)] mb-1">{label}</label>
                  <div className="flex gap-2">
                    <select
                      onChange={e => handleSetPlayers(type, e.target.value)}
                      value={currentId || ''}
                      className="w-full px-2 py-2 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-sm text-[var(--color-text)] focus:outline-none focus:border-brand-500"
                    >
                      <option value="">Select player</option>
                      {options.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    {currentPlayer?.isGuest && (
                      <button
                        onClick={() => handleRenamePlayer(currentPlayer.id, currentPlayer.name)}
                        className="px-3 py-1 bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 rounded-xl text-xs font-semibold whitespace-nowrap"
                      >
                        Rename
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        {[{ id: 'score' as const, label: '🏏 Scoring Panel' }, { id: 'card' as const, label: '📊 Scorecard' }].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-brand-600 text-white' : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'score' && currentInnings && (
        <ScoringPanel
          matchId={matchId!}
          inningsId={currentInnings.id}
          innings={currentInnings}
          players={{ batters, bowlers }}
          onRefresh={() => { refetchMatch(); qc.invalidateQueries({ queryKey: ['scoring-match'] }); qc.invalidateQueries({ queryKey: ['scoring-players'] }); }}
          onEndInnings={handleEndInnings}
          onEndMatch={handleEndMatch}
          onPause={handlePause}
          onResume={handleResume}
          matchStatus={match.status}
        />
      )}

      {activeTab === 'card' && match?.innings && match.innings.length > 0 && (
        <div className="space-y-8">
          <div className="flex justify-between items-center mb-4 print:hidden">
            <h2 className="font-bold text-xl">Detailed Scorecard</h2>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--color-surface-2)] hover:bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-sm font-medium transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Download PDF
            </button>
          </div>
          
          {match.innings.map((inning: any, index: number) => {
            const teamName = inning.battingTeam?.name || `Team ${index + 1}`;
            const isCompleted = inning.status === 'COMPLETED';
            return (
              <div key={inning.id} className="card p-4 border border-[var(--color-border)] shadow-md">
                <div className="flex justify-between items-center bg-[var(--color-surface-2)] p-3 rounded-lg mb-4 border border-[var(--color-border)]">
                  <h3 className="font-bold text-lg text-white">
                    {teamName} {inning.totalRuns}/{inning.totalWickets} 
                    <span className="text-sm font-normal text-[var(--color-text-muted)] ml-2">
                      ({Math.floor(inning.totalBalls / 6)}.{inning.totalBalls % 6} Overs)
                    </span>
                  </h3>
                  <span className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wide ${isCompleted ? 'bg-brand-500/10 text-brand-400' : 'bg-green-500/10 text-green-400'}`}>
                    {isCompleted ? 'Innings Completed' : 'Currently Batting'}
                  </span>
                </div>
                
                <ScorecardTable
                  batting={inning.battingCards || []}
                  bowling={inning.bowlingCards || []}
                  extras={{ total: inning.extras, wides: inning.wides, noBalls: inning.noBalls, byes: inning.byes, legByes: inning.legByes, penalty: inning.penalty }}
                  total={{ runs: inning.totalRuns, wickets: inning.totalWickets, overs: `${Math.floor(inning.totalBalls / 6)}.${inning.totalBalls % 6}` }}
                  fallOfWickets={inning.fallOfWickets || []}
                />
              </div>
            );
          })}
        </div>
      )}

      {!currentInnings && (
        <div className="card p-10 text-center">
          <div className="text-4xl mb-3">🏏</div>
          <p className="text-[var(--color-text-muted)]">No innings in progress. Start the match first from the Matches page.</p>
        </div>
      )}
    </div>
  );
}
