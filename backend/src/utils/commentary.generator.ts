/**
 * Automatic Cricket Commentary Generator
 * Generates context-aware, varied commentary for every ball event.
 */

interface CommentaryContext {
  runs: number;
  ballType: string;
  isWicket: boolean;
  wicketType?: string;
  batter?: string;
  bowler?: string;
  fielder?: string;
  overNumber?: number;
  ballNumber?: number;
  partnership?: number;
  totalRuns?: number;
}

// ─── Commentary Banks ────────────────────────────────────────────────────────

const DOT_BALL = [
  'Good delivery, beaten outside off.',
  'Excellent line and length, no run.',
  'Tight bowling, dot ball.',
  'Defended solidly back to the bowler.',
  'Probing delivery, the batter leaves it.',
  'Well bowled! No room to play a shot.',
  'Pushed to mid-off, no run.',
  'Back foot punch, straight to the fielder.',
  'Good length delivery, watchfully defended.',
  'Bowler does well, tight delivery.',
];

const SINGLE = [
  'Pushed through the covers for a single.',
  'Worked away to fine leg, one run.',
  'Rotated the strike smartly, one run.',
  'Nudged to mid-wicket for a single.',
  'Good placement, single taken.',
  'Tapped to point, quick single.',
  'Flicked off the pads, one run.',
  'Glanced to fine leg, single.',
];

const TWO = [
  'Driven through the gap, two runs!',
  'Good running between the wickets, two runs.',
  'Placed well into the outfield, two runs.',
  'Quick between the wickets, two taken.',
  'Excellent placement, the fielder chases, two runs.',
];

const THREE = [
  'Superb placement in the gap, three runs!',
  'Great running between the wickets, three!',
  'Misfield in the outfield, three runs.',
  'Driven to the sweeper, excellent running — three!',
];

const FOUR = [
  'FOUR! Absolutely cracking shot through the covers!',
  'FOUR! Driven beautifully, bisects the fielders!',
  'FOUR! Whipped off the pads to fine leg!',
  'FOUR! Cuts hard through backward point!',
  'FOUR! Punched off the back foot through extra cover!',
  'FOUR! Glorious drive, beats the fielder easily!',
  'FOUR! Pulled powerfully in front of square leg!',
  'FOUR! Lovely flick, races to the fine leg boundary!',
  'FOUR! Edged but through the gap, four runs!',
  'FOUR! Slapped over the infield, boundary!',
];

const SIX = [
  'SIX! Massive hit over the sightscreen!',
  'SIX! What a strike, clears the ropes easily!',
  'SIX! Launched over long-on, huge!',
  'SIX! Over the pavilion! That is enormous!',
  'SIX! Slog sweep, sailing into the stands!',
  'SIX! Reverse swept, audacious shot for six!',
  'SIX! That has gone into the second tier!',
  'SIX! Maximum! Incredible power hitting!',
  'SIX! Over mid-wicket, effortlessly!',
  'SIX! Flat-batted drive, right out of the ground!',
];

const WIDE = [
  'WIDE! Down the leg side, extra to the total.',
  'Wide called! Ball slides past the off stump.',
  'Wide delivery, cost the bowling side a run.',
  'WIDE! Going way outside off.',
  'Wide ball, penalty run added.',
];

const NO_BALL = [
  'NO BALL! Front foot lands over the crease.',
  'No ball called! Free hit coming up!',
  'NO BALL! Overstepped by the bowler.',
  'No ball — and the next delivery is a free hit!',
];

const BYE = [
  'Byes! Keeper fumbles, byes added to the total.',
  'Beats everyone, byes taken.',
  'Keeper beaten, runs added as byes.',
];

const LEG_BYE = [
  'Leg byes! Off the pad, quickly taken.',
  'Hits the pad and away for leg byes.',
  'LEG BYES! Good running, leg byes.',
];

// ─── Wicket Commentary Banks ─────────────────────────────────────────────────

const WICKET_BOWLED = [
  'BOWLED! Timber! The stumps are shattered!',
  'BOWLED! Clean bowled, the off stump is knocked back!',
  'BOWLED! What a delivery, through the gate!',
  'BOWLED! An absolute jaffa! Middle stump cartwheels!',
  'OUT! Bowled! The bowler is over the moon!',
];

const WICKET_CAUGHT = [
  'CAUGHT! Taken cleanly in the deep!',
  'OUT! Caught! The fielder takes a sharp catch!',
  'CAUGHT! Skies it and is taken at mid-off!',
  'CAUGHT behind! Edged and the keeper takes it!',
  'OUT CAUGHT! Superb catch at the boundary!',
];

const WICKET_LBW = [
  'OUT! LBW! Hits the pad right in front of middle!',
  'LBW! Plumb in front! No doubt about that!',
  'OUT LBW! Massive appeal, and the umpire raises the finger!',
  'LBW! Inswinger traps the batter in front!',
];

const WICKET_RUN_OUT = [
  'RUN OUT! Direct hit! No chance at all!',
  'OUT! Run out! Direct throw at the stumps!',
  'RUN OUT! Brilliant fielding and a spectacular direct hit!',
  'Run out! Call and response — and the batter is short!',
];

const WICKET_STUMPED = [
  'STUMPED! Lightning quick by the keeper!',
  'OUT! Stumped! Advances down the track and misses!',
  'STUMPED! The keeper whips the bails off in a flash!',
];

const WICKET_HIT_WICKET = [
  'OUT! Hit wicket! The batter dislodges the bails!',
  'HIT WICKET! Most unfortunate, dislodges his own stumps!',
];

// ─── Picker Utility ──────────────────────────────────────────────────────────

const pick = (arr: string[]): string => arr[Math.floor(Math.random() * arr.length)];

// ─── Main Generator ──────────────────────────────────────────────────────────

export const generateCommentary = (ctx: CommentaryContext): string => {
  const { runs, ballType, isWicket, wicketType, batter, bowler, fielder } = ctx;

  const bName = batter || 'The batter';
  const boName = bowler || 'The bowler';
  const fName = fielder || 'the fielder';

  // Wicket takes priority
  if (isWicket && wicketType) {
    switch (wicketType) {
      case 'BOWLED':
        return `${boName} to ${bName}. ${pick(WICKET_BOWLED)}`;
      case 'CAUGHT':
        return `${boName} to ${bName}. ${pick(WICKET_CAUGHT)} (${fName})`;
      case 'LBW':
        return `${boName} to ${bName}. ${pick(WICKET_LBW)}`;
      case 'RUN_OUT':
        return `${bName} is ${pick(WICKET_RUN_OUT)}`;
      case 'STUMPED':
        return `${boName} to ${bName}. ${pick(WICKET_STUMPED)}`;
      case 'HIT_WICKET':
        return `${boName} to ${bName}. ${pick(WICKET_HIT_WICKET)}`;
      case 'RETIRED_HURT':
        return `${bName} retires hurt! Receives medical attention.`;
      case 'OBSTRUCTING_FIELD':
        return `${bName} is out Obstructing the field! Rare dismissal.`;
      case 'HANDLED_BALL':
        return `${bName} is out for Handled Ball! Extremely rare!`;
      case 'HIT_BALL_TWICE':
        return `${bName} is out Hit Ball Twice!`;
      case 'TIMED_OUT':
        return `${bName} is Timed Out! New batter took too long.`;
      default:
        return `OUT! ${bName} is dismissed!`;
    }
  }

  // Extras
  if (ballType === 'WIDE') return pick(WIDE);
  if (ballType === 'NO_BALL') {
    const nbComment = pick(NO_BALL);
    return runs > 0 ? `${nbComment} AND ${runs} run${runs > 1 ? 's' : ''} taken!` : nbComment;
  }
  if (ballType === 'BYE') return `${pick(BYE)} ${runs} run${runs > 1 ? 's' : ''}.`;
  if (ballType === 'LEG_BYE') return `${pick(LEG_BYE)} ${runs} run${runs > 1 ? 's' : ''}.`;
  if (ballType === 'DEAD_BALL') return `DEAD BALL! Ball called dead by the umpire.`;
  if (ballType === 'PENALTY') return `PENALTY! ${runs} penalty run${runs > 1 ? 's' : ''} awarded.`;

  // Normal delivery by runs
  const prefix = `${boName} to ${bName}. `;
  switch (runs) {
    case 0: return prefix + pick(DOT_BALL);
    case 1: return prefix + pick(SINGLE);
    case 2: return prefix + pick(TWO);
    case 3: return prefix + pick(THREE);
    case 4: return prefix + pick(FOUR);
    case 5: return prefix + `FIVE! Misfield on the boundary, five runs!`;
    case 6: return prefix + pick(SIX);
    default: return prefix + `${runs} runs taken.`;
  }
};

/**
 * Generate over summary commentary
 */
export const generateOverSummary = (
  bowlerName: string,
  runs: number,
  wickets: number,
  overNumber: number
): string => {
  const overNum = overNumber + 1;
  if (runs === 0 && wickets === 0)
    return `Excellent maiden over from ${bowlerName}! Over ${overNum} — MAIDEN!`;
  if (wickets >= 2)
    return `What an over from ${bowlerName}! ${wickets} wickets in the over — ${runs} runs. Over ${overNum} complete.`;
  if (runs >= 20)
    return `Expensive over for ${bowlerName}! ${runs} runs conceded. Over ${overNum} complete.`;
  if (runs >= 12)
    return `Costly over — ${runs} runs from over ${overNum} by ${bowlerName}.`;
  return `End of over ${overNum} — ${runs} run${runs !== 1 ? 's' : ''} from ${bowlerName}'s over.`;
};
