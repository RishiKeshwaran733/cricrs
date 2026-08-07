import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <div className="text-8xl mb-6">🏏</div>
        <h1 className="font-display font-bold text-6xl gradient-text mb-2">404</h1>
        <h2 className="text-2xl font-bold text-[var(--color-text)] mb-3">Page Not Found</h2>
        <p className="text-[var(--color-text-muted)] mb-8">The page you're looking for has been bowled out.</p>
        <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold transition-colors">
          <Home size={18} /> Back to Home
        </Link>
      </motion.div>
    </div>
  );
}
