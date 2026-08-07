import { Link, useLocation } from 'react-router-dom';
import { Home, Radio, Trophy, BarChart2, Users } from 'lucide-react';

const TABS = [
  { label: 'Home', to: '/', icon: Home },
  { label: 'Live', to: '/live', icon: Radio, highlight: true },
  { label: 'Teams', to: '/teams', icon: Users },
  { label: 'Leagues', to: '/tournaments', icon: Trophy },
  { label: 'Stats', to: '/stats', icon: BarChart2 },
];

export default function MobileBottomNav() {
  const { pathname } = useLocation();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 glass border-t border-[var(--color-border)] pb-safe">
      <div className="flex">
        {TABS.map(({ label, to, icon: Icon, highlight }) => {
          const isActive = pathname === to || (to !== '/' && pathname.startsWith(to));
          return (
            <Link
              key={to}
              to={to}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold tracking-wide transition-colors ${
                isActive
                  ? 'text-brand-400'
                  : highlight
                  ? 'text-red-400'
                  : 'text-[var(--color-text-muted)]'
              }`}
            >
              <div className="relative">
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                {highlight && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />}
              </div>
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
