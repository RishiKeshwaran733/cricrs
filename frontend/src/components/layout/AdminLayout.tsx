import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, User, Trophy, Swords, Radio,
  FileBarChart, ChevronLeft, Menu, LogOut, Bell, Search, Settings, Shield, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../ui/input';

const MENU = [
  { label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Teams', to: '/admin/teams', icon: Users },
  { label: 'Players', to: '/admin/players', icon: User },
  { label: 'Tournaments', to: '/admin/tournaments', icon: Trophy },
  { label: 'Matches', to: '/admin/matches', icon: Swords },
  { label: 'Live Scoring', to: '/admin/matches', icon: Radio, highlight: true },
  { label: 'Reports', to: '/admin/reports', icon: FileBarChart },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="flex min-h-screen bg-background font-sans text-white relative">
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar - #111827 */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 240 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className={`fixed inset-y-0 left-0 z-50 md:sticky md:top-0 h-screen bg-sidebar border-r border-border flex flex-col overflow-hidden transition-transform duration-300 md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0 w-[240px]' : '-translate-x-full'
        }`}
        style={{ width: mobileMenuOpen ? 240 : undefined }} // override motion width on mobile
      >
        {/* Logo */}
        <div className="flex items-center gap-3 h-16 px-4 border-b border-border">
          <Link to="/admin/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
              <Shield size={18} className="text-white" />
            </div>
            {(!collapsed || mobileMenuOpen) && <span className="font-display font-bold text-xl tracking-tight">CricRS Admin</span>}
          </Link>
          <button
            onClick={() => mobileMenuOpen ? setMobileMenuOpen(false) : setCollapsed(!collapsed)}
            className="ml-auto p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors flex-shrink-0"
          >
            {mobileMenuOpen ? <X size={16} /> : (collapsed ? <Menu size={16} /> : <ChevronLeft size={16} />)}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
          {MENU.map(({ label, to, icon: Icon, highlight }) => {
            const isActive = pathname === to || (to !== '/admin/dashboard' && pathname.startsWith(to));
            return (
              <Link
                key={to + label}
                to={to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : highlight
                    ? 'text-danger hover:bg-danger/10'
                    : 'text-muted-foreground hover:text-white hover:bg-muted'
                }`}
                title={collapsed && !mobileMenuOpen ? label : undefined}
              >
                <Icon size={18} className="flex-shrink-0" />
                {(!collapsed || mobileMenuOpen) && (
                  <span className="text-sm whitespace-nowrap">{label}</span>
                )}
                {highlight && (!collapsed || mobileMenuOpen) && (
                  <span className="ml-auto flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-danger opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-danger" />
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Settings & User Info */}
        <div className="p-3 border-t border-border space-y-1">
          <Link
            to="/admin/settings"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-white hover:bg-muted transition-colors ${(collapsed && !mobileMenuOpen) ? 'justify-center' : ''}`}
            title={collapsed && !mobileMenuOpen ? 'Settings' : undefined}
          >
            <Settings size={18} className="flex-shrink-0" />
            {(!collapsed || mobileMenuOpen) && <span className="text-sm">Settings</span>}
          </Link>
          
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-danger hover:bg-danger/10 transition-colors ${(collapsed && !mobileMenuOpen) ? 'justify-center' : ''}`}
            title={collapsed && !mobileMenuOpen ? 'Logout' : undefined}
          >
            <LogOut size={18} className="flex-shrink-0" />
            {(!collapsed || mobileMenuOpen) && <span className="text-sm">Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 border-b border-border bg-background flex items-center justify-between px-4 md:px-6 flex-shrink-0 z-20">
          <div className="flex items-center gap-3 flex-1">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 -ml-2 rounded-lg hover:bg-sidebar text-muted-foreground transition-colors"
            >
              <Menu size={20} />
            </button>
            <div className="flex-1 max-w-md hidden sm:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input 
                  placeholder="Search players, matches, teams..." 
                  className="pl-10 bg-sidebar border-border rounded-full h-10 focus-visible:ring-primary/50"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 md:gap-4 pl-4">
            <button className="relative p-2 rounded-full hover:bg-sidebar text-muted-foreground transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full ring-2 ring-background" />
            </button>
            <div className="hidden md:block w-px h-6 bg-border mx-1"></div>
            <div className="flex items-center gap-2 md:gap-3 cursor-pointer md:p-1 md:pr-3 rounded-full hover:bg-sidebar transition-colors border border-transparent hover:border-border">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold shadow-sm">
                {user?.name?.charAt(0) || 'A'}
              </div>
              <div className="hidden md:block text-sm">
                <p className="font-medium text-white leading-tight">{user?.name || 'Admin'}</p>
                <p className="text-xs text-muted-foreground">Administrator</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto bg-background">
          <div className="max-w-[1600px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

