import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Menu, X, Sun, Moon, Wifi } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { statsService } from '../../services/team.service';
import { useDebounce } from '../../hooks/useDebounce';

const NAV_LINKS = [
  { label: 'Live', to: '/live', highlight: true },
  { label: 'Matches', to: '/' },
  { label: 'Teams', to: '/teams' },
  { label: 'Players', to: '/players' },
  { label: 'Tournaments', to: '/tournaments' },
  { label: 'Stats', to: '/stats' },
];

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { isConnected } = useSocket();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [results, setResults] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const debouncedQ = useDebounce(searchQ, 300);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [location]);

  useEffect(() => {
    if (debouncedQ.length < 2) { setResults(null); return; }
    setSearching(true);
    statsService.search(debouncedQ).then(data => {
      setResults(data.results);
      setSearching(false);
    }).catch(() => setSearching(false));
  }, [debouncedQ]);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'glass shadow-lg' : 'bg-[var(--color-bg)]'
      } border-b border-[var(--color-border)]`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm font-display">🏏</span>
          </div>
          <span className="font-display font-bold text-xl gradient-text tracking-tight">CricRS</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                link.highlight
                  ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center gap-1.5'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)]'
              }`}
            >
              {link.highlight && <span className="live-dot" />}
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Connection indicator */}
          <div className={`hidden sm:flex items-center gap-1 text-xs ${isConnected ? 'text-green-400' : 'text-gray-500'}`}>
            <Wifi size={12} />
          </div>

          {/* Search */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="p-2 rounded-lg hover:bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            <Search size={18} />
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-[var(--color-surface)] text-[var(--color-text-muted)] transition-colors"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Player Portal */}
          {user?.role === 'PLAYER' ? (
            <Link
              to="/player/dashboard"
              className="hidden sm:flex px-3 py-1.5 rounded-lg border border-brand-500 text-brand-500 hover:bg-brand-500/10 text-sm font-medium transition-colors"
            >
              My Dashboard
            </Link>
          ) : (
            <Link
              to="/player/login"
              className="hidden sm:flex px-3 py-1.5 rounded-lg border border-brand-500 text-brand-500 hover:bg-brand-500/10 text-sm font-medium transition-colors"
            >
              Player Login
            </Link>
          )}

          {/* Admin */}
          <Link
            to="/admin/dashboard"
            className="hidden sm:flex px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium transition-colors"
          >
            Admin
          </Link>

          {/* Mobile menu toggle */}
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-[var(--color-surface)] text-[var(--color-text-muted)] transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Search dropdown */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute top-16 left-0 right-0 z-50 p-4 glass border-b border-[var(--color-border)]"
            ref={searchRef}
          >
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={16} />
                <input
                  autoFocus
                  value={searchQ}
                  onChange={e => setSearchQ(e.target.value)}
                  placeholder="Search teams, players, tournaments..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] outline-none focus:border-brand-500 text-sm"
                />
              </div>
              {searching && (
                <div className="mt-2 text-center text-sm text-[var(--color-text-muted)]">Searching...</div>
              )}
              {results && (
                <div className="mt-2 space-y-2">
                  {results.teams?.length > 0 && (
                    <div>
                      <p className="text-xs text-[var(--color-text-muted)] font-semibold uppercase mb-1">Teams</p>
                      {results.teams.map((t: any) => (
                        <button key={t.id} onClick={() => { navigate(`/teams/${t.id}`); setSearchOpen(false); }}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-[var(--color-surface)] text-sm text-[var(--color-text)]">
                          {t.name} <span className="text-[var(--color-text-muted)]">({t.shortName})</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {results.players?.length > 0 && (
                    <div>
                      <p className="text-xs text-[var(--color-text-muted)] font-semibold uppercase mb-1">Players</p>
                      {results.players.map((p: any) => (
                        <button key={p.id} onClick={() => { navigate(`/players/${p.id}`); setSearchOpen(false); }}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-[var(--color-surface)] text-sm text-[var(--color-text)]">
                          {p.name} <span className="text-[var(--color-text-muted)]">— {p.team?.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-[var(--color-border)] overflow-hidden"
          >
            <nav className="px-4 py-2 space-y-1">
              {NAV_LINKS.map(link => (
                <Link key={link.to} to={link.to}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)] transition-colors">
                  {link.highlight && <span className="live-dot" />}
                  {link.label}
                </Link>
              ))}
              {user?.role === 'PLAYER' ? (
                <Link to="/player/dashboard"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-brand-400 hover:bg-brand-600/10 transition-colors">
                  My Dashboard
                </Link>
              ) : (
                <Link to="/player/login"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-brand-400 hover:bg-brand-600/10 transition-colors">
                  Player Login
                </Link>
              )}
              <Link to="/admin/dashboard"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-brand-400 hover:bg-brand-600/10 transition-colors">
                Admin Panel
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
