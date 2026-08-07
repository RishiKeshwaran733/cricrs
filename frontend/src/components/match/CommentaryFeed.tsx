import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface CommentaryItem {
  id: string;
  over: string;
  ball?: { overNumber: number; ballNumber: number; isWicket?: boolean; runsScored?: number; ballType?: string };
  commentary: string;
  createdAt?: string;
}

interface CommentaryFeedProps {
  items: CommentaryItem[];
  autoScroll?: boolean;
}

const getBallColor = (item: CommentaryItem) => {
  if (item.ball?.isWicket) return 'text-red-400';
  if (item.ball?.runsScored === 6) return 'text-yellow-400';
  if (item.ball?.runsScored === 4) return 'text-blue-400';
  if (item.ball?.ballType === 'WIDE' || item.ball?.ballType === 'NO_BALL') return 'text-purple-400';
  return 'text-[var(--color-text-muted)]';
};

export default function CommentaryFeed({ items, autoScroll = true }: CommentaryFeedProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [items.length, autoScroll]);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-[var(--color-text-muted)]">
        <MessageCircle size={40} className="mb-3 opacity-30" />
        <p className="text-sm">Commentary will appear here ball by ball</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <AnimatePresence initial={false}>
        {[...items].reverse().map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${
              item.ball?.isWicket
                ? 'bg-red-500/8 border border-red-500/15'
                : item.ball?.runsScored === 6
                ? 'bg-yellow-500/8 border border-yellow-500/15'
                : item.ball?.runsScored === 4
                ? 'bg-blue-500/8 border border-blue-500/15'
                : 'hover:bg-[var(--color-surface-2)]'
            }`}
          >
            {/* Over.Ball tag */}
            <div className={`text-xs font-mono font-bold mt-0.5 flex-shrink-0 w-10 ${getBallColor(item)}`}>
              {item.ball ? `${item.ball.overNumber}.${item.ball.ballNumber}` : item.over}
            </div>

            {/* Commentary text */}
            <p className="text-sm text-[var(--color-text)] leading-relaxed flex-1">
              {item.ball?.isWicket && (
                <span className="inline-block bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded mr-2">OUT</span>
              )}
              {item.ball?.runsScored === 6 && (
                <span className="inline-block bg-yellow-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded mr-2">SIX!</span>
              )}
              {item.ball?.runsScored === 4 && (
                <span className="inline-block bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded mr-2">FOUR!</span>
              )}
              {item.commentary}
            </p>
          </motion.div>
        ))}
      </AnimatePresence>
      <div ref={bottomRef} />
    </div>
  );
}
