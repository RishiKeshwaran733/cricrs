/**
 * Scoring Controller — Ball-by-ball scoring engine
 * The most critical module. Handles all ball events, wickets, extras,
 * undo/redo, and broadcasts live updates via Socket.io.
 */
import { Request, Response, NextFunction } from 'express';
import { PrismaClient, BallType, WicketType } from '@prisma/client';
import { createError } from '../middleware/error.middleware';
import { generateCommentary } from '../utils/commentary.generator';
import {
  calculateCRR, calculateRRR, calculateStrikeRate, calculateEconomy,
  calculateWagonWheelCoords, ballsToOvers, isInPowerplay
} from '../utils/scoring.engine';
import { syncPlayerStats } from '../utils/stats.updater';
import {
  emitBallUpdate, emitScoreUpdate, emitWicketEvent,
  emitMatchStatus, emitAdminNotification
} from '../socket/socket';

const prisma = new PrismaClient();

interface AddBallPayload {
  inningsId: string;
  overNumber: number;
  ballNumber: number;
  ballType: BallType;
  runsScored: number;
  extrasRuns: number;
  isWicket: boolean;
  wicketType?: WicketType;
  dismissedBatterId?: string;
  fielderId?: string;
  batterId: string;
  nonStrikerId: string;
  bowlerId: string;
}

/**
 * POST /api/admin/scoring/ball
 * Add a ball to the innings. Core scoring action.
 */
export const addBall = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const payload: AddBallPayload = req.body;
    const {
      inningsId, overNumber, ballNumber, ballType, runsScored, extrasRuns,
      isWicket, wicketType, dismissedBatterId, fielderId, batterId, nonStrikerId, bowlerId,
    } = payload;

    // 1. Fetch innings and match
    const innings = await prisma.innings.findUnique({
      where: { id: inningsId },
      include: { match: true, battingTeam: true, bowlingTeam: true },
    });
    if (!innings) return next(createError('Innings not found', 404));

    // 2. Fetch batter + bowler names for commentary
    const [batter, bowler] = await Promise.all([
      prisma.player.findUnique({ where: { id: batterId }, select: { name: true } }),
      prisma.player.findUnique({ where: { id: bowlerId }, select: { name: true } }),
      fielderId ? prisma.player.findUnique({ where: { id: fielderId }, select: { name: true } }) : null,
    ]);

    const isLegalBall = ballType === 'NORMAL' || ballType === 'BYE' || ballType === 'LEG_BYE';
    const totalRuns = runsScored + extrasRuns;

    // PRE-CHECKS: Enforce limits
    if (innings.match.format !== 'TEST' && isLegalBall && innings.totalBalls >= innings.match.totalOvers * 6) {
      return next(createError('Maximum overs reached for this innings', 400));
    }
    if (innings.totalWickets >= 10) {
      return next(createError('Innings is over (All Out)', 400));
    }
    if (innings.target && innings.totalRuns >= innings.target) {
      return next(createError('Match is already won', 400));
    }

    // 3. Generate auto-commentary
    const commentary = generateCommentary({
      runs: runsScored,
      ballType,
      isWicket,
      wicketType,
      batter: batter?.name,
      bowler: bowler?.name,
      overNumber,
      ballNumber,
    });

    // 4. Wagon wheel coordinates
    const { angle: wagonAngle, length: wagonLength } = calculateWagonWheelCoords(runsScored, ballType, wicketType);

    // 5. Get current score state
    const currentState = innings;
    const newLegalBalls = isLegalBall ? currentState.totalBalls + 1 : currentState.totalBalls;

    // 6. Create ball record
    const ball = await prisma.ball.create({
      data: {
        inningsId,
        overNumber,
        ballNumber,
        isLegalBall,
        ballType,
        runsScored,
        extrasRuns,
        totalRuns,
        isWicket,
        wicketType,
        dismissedBatterId,
        fielderId,
        batterId,
        nonStrikerId,
        bowlerId,
        scoreAfter: currentState.totalRuns + totalRuns,
        wicketsAfter: currentState.totalWickets + (isWicket ? 1 : 0),
        commentary,
        wagonAngle,
        wagonLength,
      },
    });

    // 7. Calculate next players on strike
    let nextBatterId: string | null = batterId;
    let nextNonStrikerId: string | null = nonStrikerId;
    let nextBowlerId: string | null = bowlerId;

    // Handle wicket
    if (isWicket) {
      if (dismissedBatterId === batterId) {
        nextBatterId = null;
      } else if (dismissedBatterId === nonStrikerId) {
        nextNonStrikerId = null;
      }
    }

    // Determine if batters crossed (ran an odd number of runs)
    let isSwap = false;
    if (ballType === 'NORMAL' || ballType === 'NO_BALL' || ballType === 'PENALTY' || ballType === 'DEAD_BALL') {
      if (runsScored % 2 !== 0) isSwap = !isSwap;
    } else if (ballType === 'WIDE') {
      if ((extrasRuns - 1) % 2 !== 0) isSwap = !isSwap;
    } else if (ballType === 'BYE' || ballType === 'LEG_BYE') {
      if (extrasRuns % 2 !== 0) isSwap = !isSwap;
    }

    // Handle over completion
    if (isLegalBall && newLegalBalls > 0 && newLegalBalls % 6 === 0) {
      isSwap = !isSwap; // swap strike at end of over
      nextBowlerId = null; // force bowler change
    }

    // Apply swap
    if (isSwap) {
      const temp = nextBatterId;
      nextBatterId = nextNonStrikerId;
      nextNonStrikerId = temp;
    }

    // 8. Update innings totals
    const isPP = isInPowerplay(newLegalBalls, innings.match.format);
    const updatedInnings = await prisma.innings.update({
      where: { id: inningsId },
      data: {
        totalRuns: { increment: totalRuns },
        totalWickets: { increment: isWicket ? 1 : 0 },
        totalBalls: { set: newLegalBalls },
        extras: { increment: extrasRuns },
        wides: ballType === 'WIDE' ? { increment: extrasRuns || 1 } : undefined,
        noBalls: ballType === 'NO_BALL' ? { increment: 1 } : undefined,
        byes: ballType === 'BYE' ? { increment: extrasRuns } : undefined,
        legByes: ballType === 'LEG_BYE' ? { increment: extrasRuns } : undefined,
        penalty: ballType === 'PENALTY' ? { increment: extrasRuns } : undefined,
        powerplayRuns: isPP ? { increment: totalRuns } : undefined,
        powerplayWickets: isPP && isWicket ? { increment: 1 } : undefined,
        currentBatterId: nextBatterId,
        currentNonStrikerId: nextNonStrikerId,
        currentBowlerId: nextBowlerId,
      },
    });

    // 9. Update batting card
    if (isLegalBall || (ballType === 'NO_BALL' && runsScored > 0)) {
      await prisma.battingCard.upsert({
        where: { inningsId_playerId: { inningsId, playerId: batterId } },
        create: {
          inningsId,
          playerId: batterId,
          battingOrder: await prisma.battingCard.count({ where: { inningsId } }) + 1,
          runs: runsScored,
          balls: isLegalBall ? 1 : 0,
          fours: runsScored === 4 ? 1 : 0,
          sixes: runsScored === 6 ? 1 : 0,
        },
        update: {
          runs: { increment: runsScored },
          balls: isLegalBall ? { increment: 1 } : undefined,
          fours: runsScored === 4 ? { increment: 1 } : undefined,
          sixes: runsScored === 6 ? { increment: 1 } : undefined,
        },
      });
    }

    // Update dismissed batter's card
    if (isWicket && dismissedBatterId) {
      await prisma.battingCard.updateMany({
        where: { inningsId, playerId: dismissedBatterId },
        data: {
          isOut: true,
          dismissalType: wicketType,
          bowlerId: ['BOWLED', 'LBW', 'CAUGHT', 'STUMPED', 'HIT_WICKET'].includes(wicketType || '') ? bowlerId : undefined,
          fielderId,
        },
      });
    }

    // 10. Update bowling card
    // Note: Wides and No Balls count against the bowler's runs, even though they aren't legal balls.
    if (isLegalBall || ballType === 'WIDE' || ballType === 'NO_BALL') {
      const bowlerRuns = runsScored + (ballType === 'WIDE' || ballType === 'NO_BALL' ? extrasRuns : 0);
      await prisma.bowlingCard.upsert({
        where: { inningsId_playerId: { inningsId, playerId: bowlerId } },
        create: {
          inningsId,
          playerId: bowlerId,
          overs: isLegalBall ? 0.1 : 0,
          balls: isLegalBall ? 1 : 0,
          runs: bowlerRuns,
          wickets: isWicket && wicketType !== 'RUN_OUT' ? 1 : 0,
          wides: ballType === 'WIDE' ? 1 : 0,
          noBalls: ballType === 'NO_BALL' ? 1 : 0,
          dotBalls: runsScored === 0 && !isWicket && ballType !== 'WIDE' && ballType !== 'NO_BALL' ? 1 : 0,
        },
        update: {
          balls: isLegalBall ? { increment: 1 } : undefined,
          runs: { increment: bowlerRuns },
          wickets: isWicket && wicketType !== 'RUN_OUT' ? { increment: 1 } : undefined,
          wides: ballType === 'WIDE' ? { increment: 1 } : undefined,
          noBalls: ballType === 'NO_BALL' ? { increment: 1 } : undefined,
          dotBalls: runsScored === 0 && !isWicket && ballType !== 'WIDE' && ballType !== 'NO_BALL' ? { increment: 1 } : undefined,
        },
      });
    }

    // 11. Fall of wicket
    if (isWicket) {
      const wicketNumber = updatedInnings.totalWickets;
      const player = await prisma.player.findUnique({ where: { id: dismissedBatterId || batterId } });
      await prisma.fallOfWicket.create({
        data: {
          inningsId,
          wicketNumber,
          runs: updatedInnings.totalRuns,
          balls: updatedInnings.totalBalls,
          over: ballsToOvers(updatedInnings.totalBalls),
          playerId: dismissedBatterId || batterId,
          playerName: player?.name || 'Unknown',
        },
      });
    }

    // 11.5 Auto-Match Result Logic (2nd Innings)
    let matchEnded = false;
    let matchResultText = '';
    let matchWinnerId: string | null = null;

    if (updatedInnings.target) {
      // Scenario 1: Batting team chased the target
      if (updatedInnings.totalRuns >= updatedInnings.target) {
        const wicketsRemaining = 10 - updatedInnings.totalWickets;
        matchEnded = true;
        matchResultText = `${innings.battingTeam.name} won by ${wicketsRemaining} wickets`;
        matchWinnerId = innings.battingTeamId;
      }
      // Scenario 2 & 3: Batting team all out or overs exhausted
      else if (updatedInnings.totalWickets >= 10 || (innings.match.format !== 'TEST' && updatedInnings.totalBalls >= innings.match.totalOvers * 6)) {
        const runDeficit = (updatedInnings.target - 1) - updatedInnings.totalRuns;
        matchEnded = true;
        if (runDeficit > 0) {
          matchResultText = `${innings.bowlingTeam.name} won by ${runDeficit} runs`;
          matchWinnerId = innings.bowlingTeamId;
        } else {
          matchResultText = 'Match Tied';
        }
      }
    }

    if (matchEnded) {
      // Complete the match
      await prisma.match.update({
        where: { id: innings.matchId },
        data: { status: 'COMPLETED', resultText: matchResultText, winnerId: matchWinnerId },
      });
      // Complete the innings
      await prisma.innings.updateMany({
        where: { matchId: innings.matchId, status: 'IN_PROGRESS' },
        data: { status: 'COMPLETED' },
      });
      emitMatchStatus(innings.matchId, 'COMPLETED');
      emitAdminNotification({ type: 'MATCH_ENDED', message: `Match completed. ${matchResultText}`, matchId: innings.matchId });
    }

    // 12. Calculate live stats
    const totalMatchBalls = innings.match.totalOvers * 6;
    const crr = calculateCRR(updatedInnings.totalRuns, updatedInnings.totalBalls);
    const rrr = innings.target
      ? calculateRRR(innings.target, updatedInnings.totalRuns, totalMatchBalls, updatedInnings.totalBalls)
      : undefined;

    // 13. Emit socket events
    const livePayload = {
      ball,
      innings: updatedInnings,
      crr,
      rrr,
      overs: ballsToOvers(updatedInnings.totalBalls),
    };

    emitBallUpdate(innings.matchId, livePayload);
    emitScoreUpdate(innings.matchId, livePayload);
    if (isWicket) {
      emitWicketEvent(innings.matchId, { ...livePayload, wicketType });
    }

    // 14. Sync global player stats (async, fire & forget is fine but await ensures consistency)
    await Promise.all([
      syncPlayerStats(batterId),
      syncPlayerStats(bowlerId),
      fielderId ? syncPlayerStats(fielderId) : Promise.resolve(),
      dismissedBatterId && dismissedBatterId !== batterId ? syncPlayerStats(dismissedBatterId) : Promise.resolve()
    ]);

    res.json({ success: true, ball, innings: updatedInnings, crr, rrr });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/scoring/ball/:id
 * Undo/delete last ball (soft delete + reverse totals)
 */
export const undoBall = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ball = await prisma.ball.findUnique({ where: { id: req.params.id } });
    if (!ball || ball.isDeleted) return next(createError('Ball not found', 404));

    const isLegal = ball.isLegalBall;

    // Soft delete
    await prisma.ball.update({ where: { id: ball.id }, data: { isDeleted: true } });

    // Reverse innings totals
    await prisma.innings.update({
      where: { id: ball.inningsId },
      data: {
        totalRuns: { decrement: ball.totalRuns },
        totalWickets: { decrement: ball.isWicket ? 1 : 0 },
        totalBalls: isLegal ? { decrement: 1 } : undefined,
        extras: { decrement: ball.extrasRuns },
        currentBatterId: ball.batterId,
        currentNonStrikerId: ball.nonStrikerId,
        currentBowlerId: ball.bowlerId,
      },
    });

    // Reverse batting card
    if (ball.batterId && isLegal) {
      await prisma.battingCard.updateMany({
        where: { inningsId: ball.inningsId, playerId: ball.batterId },
        data: {
          runs: { decrement: ball.runsScored },
          balls: { decrement: 1 },
          fours: ball.runsScored === 4 ? { decrement: 1 } : undefined,
          sixes: ball.runsScored === 6 ? { decrement: 1 } : undefined,
        },
      });
    }

    // Reverse bowling card
    if (ball.bowlerId && isLegal) {
      await prisma.bowlingCard.updateMany({
        where: { inningsId: ball.inningsId, playerId: ball.bowlerId },
        data: {
          balls: { decrement: 1 },
          runs: { decrement: ball.runsScored },
          wickets: ball.isWicket ? { decrement: 1 } : undefined,
        },
      });
    }

    const innings = await prisma.innings.findUnique({ where: { id: ball.inningsId } });
    emitScoreUpdate(innings?.matchId || '', { innings, undone: true });

    // Sync global stats
    await Promise.all([
      ball.batterId ? syncPlayerStats(ball.batterId) : Promise.resolve(),
      ball.bowlerId ? syncPlayerStats(ball.bowlerId) : Promise.resolve(),
      ball.fielderId ? syncPlayerStats(ball.fielderId) : Promise.resolve(),
      ball.dismissedBatterId && ball.dismissedBatterId !== ball.batterId ? syncPlayerStats(ball.dismissedBatterId) : Promise.resolve()
    ]);

    res.json({ success: true, message: 'Ball undone' });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/scoring/innings/:id/scorecard
 * Full innings scorecard
 */
export const getInningsScorecard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const innings = await prisma.innings.findUnique({
      where: { id: req.params.id },
      include: {
        battingTeam: true,
        bowlingTeam: true,
        battingCards: { include: { player: true, bowler: { select: { name: true } }, fielder: { select: { name: true } } }, orderBy: { battingOrder: 'asc' } },
        bowlingCards: { include: { player: true }, orderBy: { wickets: 'desc' } },
        fallOfWickets: { orderBy: { wicketNumber: 'asc' } },
        partnerships: { orderBy: { wicketNumber: 'asc' } },
        balls: {
          where: { isDeleted: false },
          orderBy: [{ overNumber: 'asc' }, { ballNumber: 'asc' }],
          take: 200,
        },
      },
    });

    if (!innings) return next(createError('Innings not found', 404));

    // Calculate derived stats
    const match = await prisma.match.findUnique({ where: { id: innings.matchId } });
    const totalMatchBalls = (match?.totalOvers || 20) * 6;
    const crr = calculateCRR(innings.totalRuns, innings.totalBalls);
    const rrr = innings.target
      ? calculateRRR(innings.target, innings.totalRuns, totalMatchBalls, innings.totalBalls)
      : undefined;

    // Enrich batting cards with strike rate
    const enrichedBatting = (innings as any).battingCards.map((card: any) => {
      let dismissalText = undefined;
      if (card.isOut) {
        if (card.dismissalType === 'BOWLED') dismissalText = `b ${card.bowler?.name || 'unknown'}`;
        else if (card.dismissalType === 'CAUGHT') dismissalText = `c ${card.fielder?.name || 'sub'} b ${card.bowler?.name || 'unknown'}`;
        else if (card.dismissalType === 'LBW') dismissalText = `lbw b ${card.bowler?.name || 'unknown'}`;
        else if (card.dismissalType === 'RUN_OUT') dismissalText = `run out (${card.fielder?.name || 'unknown'})`;
        else if (card.dismissalType === 'STUMPED') dismissalText = `st ${card.fielder?.name || 'unknown'} b ${card.bowler?.name || 'unknown'}`;
        else dismissalText = card.dismissalType?.replace(/_/g, ' ').toLowerCase();
      }
      return {
        ...card,
        strikeRate: calculateStrikeRate(card.runs, card.balls),
        dismissalText
      };
    });

    // Enrich bowling cards with economy
    const enrichedBowling = (innings as any).bowlingCards.map((card: any) => ({
      ...card,
      economy: calculateEconomy(card.runs, card.balls),
      overs: ballsToOvers(card.balls),
    }));

    res.json({
      success: true,
      innings: {
        ...innings,
        battingCards: enrichedBatting,
        bowlingCards: enrichedBowling,
        crr,
        rrr,
        oversDisplay: ballsToOvers(innings.totalBalls),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/scoring/innings/:id/set-players
 * Set current batter/non-striker/bowler
 */
export const setCurrentPlayers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { currentBatterId, currentNonStrikerId, currentBowlerId } = req.body;
    const innings = await prisma.innings.update({
      where: { id: req.params.id },
      data: {
        ...(currentBatterId && { currentBatterId }),
        ...(currentNonStrikerId && { currentNonStrikerId }),
        ...(currentBowlerId && { currentBowlerId }),
      },
    });
    res.json({ success: true, innings });
  } catch (error) {
    next(error);
  }
};
