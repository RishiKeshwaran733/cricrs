import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';

// Layouts
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import MobileBottomNav from './components/layout/MobileBottomNav';
import AdminLayout from './components/layout/AdminLayout';

// Public pages
import HomePage from './pages/HomePage';
import LiveMatchesPage from './pages/LiveMatchesPage';
import MatchDetailPage from './pages/MatchDetailPage';
import TeamsPage from './pages/TeamsPage';
import TeamDetailPage from './pages/TeamDetailPage';
import PlayersPage from './pages/PlayersPage';
import PlayerProfilePage from './pages/PlayerProfilePage';
import TournamentsPage from './pages/TournamentsPage';
import TournamentDetailPage from './pages/TournamentDetailPage';
import StatsPage from './pages/StatsPage';
import SearchPage from './pages/SearchPage';
import NotFoundPage from './pages/NotFoundPage';
import PlayerLoginPage from './pages/player/PlayerLoginPage';
import PlayerDashboardPage from './pages/player/PlayerDashboardPage';

// Admin pages
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminTeamsPage from './pages/admin/AdminTeamsPage';
import AdminPlayersPage from './pages/admin/AdminPlayersPage';
import AdminTournamentsPage from './pages/admin/AdminTournamentsPage';
import AdminMatchesPage from './pages/admin/AdminMatchesPage';
import AdminScoringPage from './pages/admin/AdminScoringPage';
import AdminReportsPage from './pages/admin/AdminReportsPage';
import ProtectedRoute from './components/layout/ProtectedRoute';

// Public layout wrapper
const PublicLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen flex flex-col bg-[var(--color-bg)]">
    <Navbar />
    <main className="flex-1">{children}</main>
    <Footer />
    <MobileBottomNav />
  </div>
);

// Player layout wrapper (Isolated, no global navigation)
const PlayerLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen flex flex-col bg-[var(--color-bg)]">
    <header className="h-16 px-4 md:px-6 border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur-md sticky top-0 z-50 flex items-center">
      <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <span className="text-xl">🏏</span>
        <span className="font-display font-bold text-xl tracking-tight text-white">CricRS</span>
      </a>
      <div className="ml-auto flex items-center">
        <span className="text-xs font-semibold text-brand-400 bg-brand-500/10 px-3 py-1 rounded-full border border-brand-500/20">
          Player Portal
        </span>
      </div>
    </header>
    <main className="flex-1 flex flex-col">{children}</main>
    <Footer />
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <Routes>
              {/* Admin routes */}
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route
                path="/admin/*"
                element={
                  <ProtectedRoute>
                    <AdminLayout>
                      <Routes>
                        <Route path="dashboard" element={<AdminDashboardPage />} />
                        <Route path="teams" element={<AdminTeamsPage />} />
                        <Route path="players" element={<AdminPlayersPage />} />
                        <Route path="tournaments" element={<AdminTournamentsPage />} />
                        <Route path="matches" element={<AdminMatchesPage />} />
                        <Route path="scoring/:matchId" element={<AdminScoringPage />} />
                        <Route path="reports" element={<AdminReportsPage />} />
                        <Route path="" element={<AdminDashboardPage />} />
                      </Routes>
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />

              {/* Player routes */}
              <Route
                path="/player/*"
                element={
                  <PlayerLayout>
                    <Routes>
                      <Route path="login" element={<PlayerLoginPage />} />
                      <Route path="dashboard" element={<PlayerDashboardPage />} />
                    </Routes>
                  </PlayerLayout>
                }
              />

              {/* Public routes */}
              <Route
                path="/*"
                element={
                  <PublicLayout>
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/live" element={<LiveMatchesPage />} />
                      <Route path="/matches/:id" element={<MatchDetailPage />} />
                      <Route path="/teams" element={<TeamsPage />} />
                      <Route path="/teams/:id" element={<TeamDetailPage />} />
                      <Route path="/players" element={<PlayersPage />} />
                      <Route path="/players/:id" element={<PlayerProfilePage />} />
                      <Route path="/tournaments" element={<TournamentsPage />} />
                      <Route path="/tournaments/:id" element={<TournamentDetailPage />} />
                      <Route path="/stats" element={<StatsPage />} />
                      <Route path="/search" element={<SearchPage />} />

                      <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                  </PublicLayout>
                }
              />
            </Routes>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
