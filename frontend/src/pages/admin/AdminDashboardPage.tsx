import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Users, User, Radio, Trophy, Activity, ArrowRight, PlusCircle, ShieldAlert, Calendar } from 'lucide-react';
import { statsService } from '../../services/team.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: statsService.getDashboard,
    refetchInterval: 30_000,
  });

  const stats = data?.stats;
  const notifications = data?.recentNotifications || [];

  const STAT_CARDS = [
    { title: 'Total Teams', value: stats?.totalTeams ?? 0, icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
    { title: 'Total Players', value: stats?.totalPlayers ?? 0, icon: User, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { title: 'Total Tournaments', value: stats?.totalTournaments ?? 0, icon: Trophy, color: 'text-success', bg: 'bg-success/10' },
    { title: 'Active Matches', value: (stats?.liveMatches ?? 0) + (stats?.upcomingMatches ?? 0), icon: Activity, color: 'text-warning', bg: 'bg-warning/10' },
    { title: 'Live Matches', value: stats?.liveMatches ?? 0, icon: Radio, color: 'text-danger', bg: 'bg-danger/10' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard Overview</h1>
          <p className="text-muted-foreground mt-1">Welcome back. Here is the latest data for your platform.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/admin/matches/new">
            <Button className="gap-2">
              <PlusCircle size={16} />
              Start Match
            </Button>
          </Link>
          <Link to="/admin/teams/new">
            <Button variant="outline" className="gap-2">
              <ShieldAlert size={16} />
              Add Team
            </Button>
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {STAT_CARDS.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="hover:border-primary/50 transition-colors cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                    <div className="text-3xl font-bold">
                      {isLoading ? <div className="h-9 w-12 bg-muted animate-pulse rounded-md" /> : card.value}
                    </div>
                  </div>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${card.bg} group-hover:scale-110 transition-transform`}>
                    <card.icon size={24} className={card.color} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent matches / Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system events and match updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-muted animate-pulse flex-shrink-0" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                      <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
                    </div>
                  </div>
                ))
              ) : notifications.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground border border-dashed border-border rounded-xl">
                  No recent activity found.
                </div>
              ) : (
                notifications.map((n: any, i: number) => (
                  <div key={n.id || i} className="flex items-start gap-4 p-4 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Activity size={18} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{n.title}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                      <p className="text-xs text-muted-foreground mt-2 font-mono">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Frequently used tools</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Link to="/admin/tournaments">
              <Button variant="secondary" className="w-full justify-start h-12 gap-3 text-white">
                <Trophy size={18} className="text-success" />
                Manage Tournaments
              </Button>
            </Link>
            <Link to="/admin/players">
              <Button variant="secondary" className="w-full justify-start h-12 gap-3 text-white">
                <User size={18} className="text-purple-400" />
                Manage Players
              </Button>
            </Link>
            <Link to="/admin/matches">
              <Button variant="secondary" className="w-full justify-start h-12 gap-3 text-white">
                <Calendar size={18} className="text-warning" />
                Schedule Match
              </Button>
            </Link>
            <Link to="/admin/reports">
              <Button variant="secondary" className="w-full justify-start h-12 gap-3 text-white">
                <Activity size={18} className="text-primary" />
                View Reports
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
