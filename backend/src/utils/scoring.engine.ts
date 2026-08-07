/**
 * Cricket Scoring Engine
 * Handles all calculation logic: CRR, RRR, partnerships,
 * fall of wickets, projections, powerplay, extras, wagon wheel data.
 */

export interface OverSummary {
  overNumber: number;
  runs: number;
  wickets: number;
  balls: BallSummary[];
  maidenOver: boolean;
}

export interface BallSummary {
  overNumber: number;
  ballNumber: number;
  runsScored: number;
  extrasRuns: number;
  totalRuns: number;
  ballType: string;
  isWicket: boolean;
  wicketType?: string;
  commentary?: string;
}

export interface ScorecardState {
  totalRuns: number;
  totalWickets: number;
  totalBalls: number;
  legalBalls: number;
  overs: string;         // e.g. "12.3"
  currentRunRate: number;
  requiredRunRate?: number;
  target?: number;
  runsRequired?: number;
  ballsRemaining?: number;
  projectedScore?: number;
  extras: {
    total: number;
    wides: number;
    noBalls: number;
    byes: number;
    legByes: number;
    penalty: number;
  };
  powerplay: {
    runs: number;
    wickets: number;
    overs: string;
  };
}

// ─── Core Calculations ────────────────────────────────────────────────────────

/**
 * Convert balls to overs string: e.g. 13 balls → "2.1"
 */
export const ballsToOvers = (legalBalls: number): string => {
  const completedOvers = Math.floor(legalBalls / 6);
  const remainingBalls = legalBalls % 6;
  return `${completedOvers}.${remainingBalls}`;
};

/**
 * Convert overs string to total balls: "2.1" → 13
 */
export const oversToTotalBalls = (overs: string): number => {
  const [o, b] = overs.split('.').map(Number);
  return o * 6 + (b || 0);
};

/**
 * Calculate current run rate
 * CRR = (runs scored / legal balls faced) * 6
 */
export const calculateCRR = (runs: number, legalBalls: number): number => {
  if (legalBalls === 0) return 0;
  return parseFloat(((runs / legalBalls) * 6).toFixed(2));
};

/**
 * Calculate required run rate
 * RRR = (runs required / balls remaining) * 6
 */
export const calculateRRR = (
  target: number,
  currentRuns: number,
  totalOversBalls: number,   // total legal balls in match
  ballsFaced: number
): number => {
  const runsRequired = target - currentRuns;
  const ballsRemaining = totalOversBalls - ballsFaced;
  if (ballsRemaining <= 0 || runsRequired <= 0) return 0;
  return parseFloat(((runsRequired / ballsRemaining) * 6).toFixed(2));
};

/**
 * Calculate projected score based on current CRR
 */
export const calculateProjectedScore = (
  runs: number,
  legalBalls: number,
  totalOversBalls: number
): number => {
  if (legalBalls === 0) return 0;
  const crr = (runs / legalBalls) * 6;
  return Math.round((crr * totalOversBalls) / 6);
};

/**
 * Calculate batting strike rate
 */
export const calculateStrikeRate = (runs: number, balls: number): number => {
  if (balls === 0) return 0;
  return parseFloat(((runs / balls) * 100).toFixed(2));
};

/**
 * Calculate bowling economy
 */
export const calculateEconomy = (runs: number, legalBalls: number): number => {
  if (legalBalls === 0) return 0;
  return parseFloat(((runs / legalBalls) * 6).toFixed(2));
};

/**
 * Calculate batting average
 */
export const calculateBattingAverage = (runs: number, dismissals: number): number => {
  if (dismissals === 0) return runs; // not out
  return parseFloat((runs / dismissals).toFixed(2));
};

/**
 * Calculate bowling average
 */
export const calculateBowlingAverage = (runs: number, wickets: number): number => {
  if (wickets === 0) return 0;
  return parseFloat((runs / wickets).toFixed(2));
};

/**
 * Build full scorecard state from innings data
 */
export const buildScorecardState = (
  totalRuns: number,
  totalWickets: number,
  legalBalls: number,
  extras: { wides: number; noBalls: number; byes: number; legByes: number; penalty: number },
  powerplay: { runs: number; wickets: number; balls: number },
  totalMatchBalls: number,
  target?: number
): ScorecardState => {
  const crr = calculateCRR(totalRuns, legalBalls);
  const overs = ballsToOvers(legalBalls);
  const extrasTotal = extras.wides + extras.noBalls + extras.byes + extras.legByes + extras.penalty;

  const state: ScorecardState = {
    totalRuns,
    totalWickets,
    totalBalls: legalBalls + extras.wides + extras.noBalls,
    legalBalls,
    overs,
    currentRunRate: crr,
    extras: { total: extrasTotal, ...extras },
    powerplay: {
      runs: powerplay.runs,
      wickets: powerplay.wickets,
      overs: ballsToOvers(powerplay.balls),
    },
    projectedScore: calculateProjectedScore(totalRuns, legalBalls, totalMatchBalls),
  };

  if (target !== undefined) {
    const runsRequired = target - totalRuns;
    const ballsRemaining = totalMatchBalls - legalBalls;
    state.target = target;
    state.runsRequired = Math.max(0, runsRequired);
    state.ballsRemaining = Math.max(0, ballsRemaining);
    state.requiredRunRate = calculateRRR(target, totalRuns, totalMatchBalls, legalBalls);
  }

  return state;
};

/**
 * Determine if a ball is in the powerplay
 */
export const isInPowerplay = (legalBall: number, format: string): boolean => {
  // T20: first 6 overs (36 legal balls)
  // ODI: first 10 overs (60 legal balls)
  const pp = format === 'ODI' ? 60 : 36;
  return legalBall <= pp;
};

/**
 * Get over summary from list of balls
 */
export const getOverSummaries = (balls: BallSummary[]): OverSummary[] => {
  const overMap = new Map<number, BallSummary[]>();
  
  for (const ball of balls) {
    if (!overMap.has(ball.overNumber)) {
      overMap.set(ball.overNumber, []);
    }
    overMap.get(ball.overNumber)!.push(ball);
  }

  const summaries: OverSummary[] = [];
  for (const [overNumber, ballList] of overMap) {
    const runs = ballList.reduce((sum, b) => sum + b.totalRuns, 0);
    const wickets = ballList.filter(b => b.isWicket).length;
    const maidenOver = runs === 0 && ballList.filter(b => b.ballType === 'NORMAL').length >= 6;
    summaries.push({ overNumber, runs, wickets, balls: ballList, maidenOver });
  }

  return summaries.sort((a, b) => a.overNumber - b.overNumber);
};

/**
 * Calculate Net Run Rate for points table
 */
export const calculateNRR = (
  runsFor: number,
  oversFor: number,
  runsAgainst: number,
  oversAgainst: number
): number => {
  if (oversFor === 0 || oversAgainst === 0) return 0;
  const rpo1 = runsFor / oversFor;
  const rpo2 = runsAgainst / oversAgainst;
  return parseFloat((rpo1 - rpo2).toFixed(3));
};

/**
 * Wagon wheel coordinates for a shot
 * Returns angle (degrees from straight) and length (0–1)
 */
export const calculateWagonWheelCoords = (
  runs: number,
  ballType: string,
  wicketType?: string
): { angle: number; length: number } => {
  if (runs === 0 || ballType === 'WIDE') {
    return { angle: 0, length: 0 };
  }
  // Randomize direction realistically (proper impl would use zone input)
  const angle = Math.random() * 360;
  // Length based on runs
  const lengthMap: Record<number, number> = { 1: 0.4, 2: 0.5, 3: 0.65, 4: 0.85, 5: 0.9, 6: 1.0 };
  const length = wicketType ? 0.2 : (lengthMap[Math.min(runs, 6)] ?? 0.3);
  return { angle: parseFloat(angle.toFixed(1)), length: parseFloat(length.toFixed(2)) };
};

/**
 * Format overs for display: 13 balls → "2.1 ov"
 */
export const formatOvers = (legalBalls: number, withUnit = true): string => {
  const ov = ballsToOvers(legalBalls);
  return withUnit ? `${ov} ov` : ov;
};
