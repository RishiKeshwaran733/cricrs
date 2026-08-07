import { useEffect, useState, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import { matchService } from '../services/match.service';

interface LiveMatchState {
  innings: any;
  crr: number;
  rrr?: number;
  overs: string;
  lastBall: any;
}

export function useLiveMatch(matchId: string, inningsId?: string) {
  const { socket, joinMatch, leaveMatch } = useSocket();
  const [liveState, setLiveState] = useState<LiveMatchState | null>(null);
  const [scorecard, setScorecard] = useState<any>(null);

  // Fetch initial scorecard
  const fetchScorecard = useCallback(async () => {
    if (!inningsId) return;
    try {
      const data = await matchService.getInningsScorecard(inningsId);
      setScorecard(data.innings);
    } catch (e) {
      console.error('Failed to fetch scorecard', e);
    }
  }, [inningsId]);

  useEffect(() => {
    fetchScorecard();
  }, [fetchScorecard]);

  // Join socket room
  useEffect(() => {
    if (!matchId) return;
    joinMatch(matchId);
    return () => leaveMatch(matchId);
  }, [matchId, joinMatch, leaveMatch]);

  // Listen to socket events
  useEffect(() => {
    if (!socket) return;

    const onBallUpdate = (data: LiveMatchState) => {
      setLiveState(data);
      if (data.innings) {
        setScorecard((prev: any) => prev ? { ...prev, ...data.innings } : data.innings);
      }
    };

    const onScoreUpdate = (data: any) => {
      setLiveState(data);
    };

    socket.on('ball_update', onBallUpdate);
    socket.on('score_update', onScoreUpdate);

    return () => {
      socket.off('ball_update', onBallUpdate);
      socket.off('score_update', onScoreUpdate);
    };
  }, [socket]);

  return { liveState, scorecard, refetch: fetchScorecard };
}
