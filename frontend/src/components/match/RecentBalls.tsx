import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

interface BallEvent {
  id: string;
  ballType: string;
  runsScored: number;
  isWicket: boolean;
  wicketType?: string;
  overNumber: number;
  ballNumber: number;
}

const getBallClass = (ball: BallEvent): string => {
  if (ball.isWicket) return 'ball ball-W';
  if (ball.ballType === 'WIDE') return 'ball ball-Wd';
  if (ball.ballType === 'NO_BALL') return 'ball ball-Nb';
  if (ball.runsScored === 6) return 'ball ball-6';
  if (ball.runsScored === 4) return 'ball ball-4';
  if (ball.runsScored === 3) return 'ball ball-3';
  if (ball.runsScored === 2) return 'ball ball-2';
  if (ball.runsScored === 1) return 'ball ball-1';
  return 'ball ball-0';
};

const getBallLabel = (ball: BallEvent): string => {
  if (ball.isWicket) return 'W';
  if (ball.ballType === 'WIDE') return 'Wd';
  if (ball.ballType === 'NO_BALL') return 'Nb';
  if (ball.ballType === 'BYE') return `${ball.runsScored}b`;
  if (ball.ballType === 'LEG_BYE') return `${ball.runsScored}lb`;
  return String(ball.runsScored);
};

interface RecentBallsProps {
  balls: BallEvent[];
  maxShow?: number;
}

export default function RecentBalls({ balls, maxShow = 6 }: RecentBallsProps) {
  // Group by current over (last N legal balls)
  const recentBalls = [...balls].reverse().slice(0, maxShow).reverse();

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {recentBalls.map((ball, i) => (
        <AnimatePresence key={ball.id} mode="popLayout">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className={clsx(getBallClass(ball), 'animate-bounce-in')}
            title={`Over ${ball.overNumber}.${ball.ballNumber}`}
          >
            {getBallLabel(ball)}
          </motion.div>
        </AnimatePresence>
      ))}
    </div>
  );
}
