import { PrismaClient } from '@prisma/client';
import { calculateStrikeRate, calculateEconomy, calculateBattingAverage, calculateBowlingAverage } from './scoring.engine';

const prisma = new PrismaClient();

export const syncPlayerStats = async (playerId: string) => {
  if (!playerId) return;

  // Aggregate Batting Cards
  const battingCards = await prisma.battingCard.findMany({
    where: { playerId },
    select: { runs: true, balls: true, fours: true, sixes: true, isOut: true }
  });

  let totalRuns = 0;
  let totalBalls = 0;
  let totalFours = 0;
  let totalSixes = 0;
  let timesOut = 0;
  let highestScore = 0;

  for (const card of battingCards) {
    totalRuns += card.runs;
    totalBalls += card.balls;
    totalFours += card.fours;
    totalSixes += card.sixes;
    if (card.isOut) timesOut++;
    if (card.runs > highestScore) highestScore = card.runs;
  }

  // Aggregate Bowling Cards
  const bowlingCards = await prisma.bowlingCard.findMany({
    where: { playerId },
    select: { runs: true, balls: true, wickets: true }
  });

  let totalRunsConceded = 0;
  let totalBallsBowled = 0;
  let totalWickets = 0;
  let bestBowlingRuns = 999;
  let bestBowlingWickets = -1;

  for (const card of bowlingCards) {
    totalRunsConceded += card.runs;
    totalBallsBowled += card.balls;
    totalWickets += card.wickets;
    
    if (card.wickets > bestBowlingWickets || (card.wickets === bestBowlingWickets && card.runs < bestBowlingRuns)) {
      bestBowlingWickets = card.wickets;
      bestBowlingRuns = card.runs;
    }
  }

  const bestBowling = bestBowlingWickets > 0 ? `${bestBowlingWickets}/${bestBowlingRuns}` : null;

  // Aggregate Fielding (from Balls where this player was the fielder)
  const fieldingBalls = await prisma.ball.findMany({
    where: { fielderId: playerId, isWicket: true, isDeleted: false },
    select: { wicketType: true }
  });

  let totalCatches = 0;
  let totalStumpings = 0;
  let totalRunOuts = 0;

  for (const ball of fieldingBalls) {
    if (ball.wicketType === 'CAUGHT') totalCatches++;
    if (ball.wicketType === 'STUMPED') totalStumpings++;
    if (ball.wicketType === 'RUN_OUT') totalRunOuts++;
  }

  // Calculate Averages and Rates
  const battingAvg = calculateBattingAverage(totalRuns, timesOut);
  const strikeRate = calculateStrikeRate(totalRuns, totalBalls);
  const bowlingAvg = calculateBowlingAverage(totalRunsConceded, totalWickets);
  const economy = calculateEconomy(totalRunsConceded, totalBallsBowled);

  // Get total matches played
  const matches = await prisma.battingCard.findMany({
    where: { playerId },
    select: { innings: { select: { matchId: true } } }
  });
  const bowlingMatches = await prisma.bowlingCard.findMany({
    where: { playerId },
    select: { innings: { select: { matchId: true } } }
  });
  // Calculate total matches by unique matchId
  const uniqueMatches = new Set([
    ...matches.map(m => m.innings.matchId),
    ...bowlingMatches.map(m => m.innings.matchId)
  ]);
  const totalMatches = uniqueMatches.size;

  await prisma.player.update({
    where: { id: playerId },
    data: {
      totalMatches,
      totalRuns,
      highestScore,
      totalFours,
      totalSixes,
      totalWickets,
      totalCatches,
      totalStumpings,
      totalRunOuts,
      battingAvg,
      strikeRate,
      bowlingAvg,
      economy,
      bestBowling,
    }
  });
};
