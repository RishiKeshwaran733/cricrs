import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="mt-20 pb-20 lg:pb-0 border-t border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="max-w-7xl mx-auto px-4 py-10 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🏏</span>
              <span className="font-display font-bold text-xl gradient-text">CricRS</span>
            </div>
            <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
              Live cricket scores, commentary, and statistics. The ultimate cricket companion.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-3 text-[var(--color-text)]">Live</h4>
            <ul className="space-y-2">
              {[['Live Scores', '/live'], ['Matches', '/'], ['Tournaments', '/tournaments']].map(([l, h]) => (
                <li key={h}><Link to={h} className="text-sm text-[var(--color-text-muted)] hover:text-brand-400 transition-colors">{l}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-3 text-[var(--color-text)]">Cricket</h4>
            <ul className="space-y-2">
              {[['Teams', '/teams'], ['Players', '/players'], ['Statistics', '/stats']].map(([l, h]) => (
                <li key={h}><Link to={h} className="text-sm text-[var(--color-text-muted)] hover:text-brand-400 transition-colors">{l}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-3 text-[var(--color-text)]">Platform</h4>
            <ul className="space-y-2">
              <li><Link to="/admin/login" className="text-sm text-[var(--color-text-muted)] hover:text-brand-400 transition-colors">Admin Login</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-[var(--color-border)] flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-[var(--color-text-muted)]">
            © {new Date().getFullYear()} CricRS. All rights reserved.
          </p>
          <p className="text-xs text-[var(--color-text-muted)]">
            Built with ❤️ for cricket fans worldwide
          </p>
        </div>
      </div>
    </footer>
  );
}
