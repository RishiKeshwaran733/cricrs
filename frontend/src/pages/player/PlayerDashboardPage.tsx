import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { LogOut, User as UserIcon, Activity, Target, Shield, Trophy, Camera } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { playerService } from '../../services/team.service';
import toast from 'react-hot-toast';

export default function PlayerDashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [playerData, setPlayerData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'PLAYER') {
      navigate('/player/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await playerService.getPlayer(user.id);
        setPlayerData(res.player);
      } catch (e) {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user, navigate]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('photo', file);

    try {
      const res = await playerService.updateMyPhoto(formData);
      setPlayerData(res.player);
      toast.success('Profile photo updated successfully');
    } catch (error) {
      toast.error('Failed to update profile photo');
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/player/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!playerData) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 mt-16 animate-in fade-in duration-500">
      {/* Header Profile Section */}
      <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 mb-8 bg-[var(--color-surface)] p-6 rounded-3xl border border-[var(--color-border)] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-brand-600/20 to-blue-600/20" />
        
        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10 w-full">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full bg-brand-500/20 flex flex-shrink-0 items-center justify-center border-2 border-brand-500 text-white font-bold text-3xl overflow-hidden shadow-lg shadow-brand-500/20">
              {playerData.photo ? <img src={playerData.photo} alt={playerData.name} className="w-full h-full object-cover" /> : playerData.name.charAt(0)}
            </div>
            <label className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
              {uploading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera size={24} className="text-white" />
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
            </label>
          </div>
          
          <div className="text-center md:text-left flex-1">
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">{playerData.name}</h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <span className="px-3 py-1 rounded-full bg-brand-500/10 text-brand-400 text-sm font-semibold border border-brand-500/20">
                {playerData.role.replace(/_/g, ' ')}
              </span>
              {playerData.team && (
                <span className="px-3 py-1 rounded-full bg-[var(--color-surface-2)] text-[var(--color-text-muted)] text-sm font-medium border border-[var(--color-border)] flex items-center gap-2">
                  {playerData.team.logo && <img src={playerData.team.logo} alt="Team" className="w-4 h-4 rounded-full" />}
                  {playerData.team.name}
                </span>
              )}
            </div>
          </div>
          
          <Button variant="outline" onClick={handleLogout} className="shrink-0 gap-2 text-danger hover:text-danger hover:bg-danger/10 border-danger/20">
            <LogOut size={16} /> Logout
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Batting Stats */}
        <Card className="bg-[var(--color-surface)] border-[var(--color-border)] shadow-lg overflow-hidden">
          <div className="bg-brand-500/10 p-4 border-b border-[var(--color-border)] flex items-center gap-3">
            <Target className="text-brand-400" size={20} />
            <h2 className="font-bold text-lg text-white">Batting Statistics</h2>
          </div>
          <CardContent className="p-0">
            <div className="grid grid-cols-2 divide-x divide-y divide-[var(--color-border)]">
              <StatBox label="Matches" value={playerData.totalMatches} />
              <StatBox label="Runs" value={playerData.totalRuns} valueColor="text-brand-400" />
              <StatBox label="Average" value={playerData.battingAvg.toFixed(2)} />
              <StatBox label="Strike Rate" value={playerData.strikeRate.toFixed(2)} />
              <StatBox label="Highest Score" value={playerData.highestScore} />
              <StatBox label="Fours / Sixes" value={`${playerData.totalFours} / ${playerData.totalSixes}`} />
            </div>
          </CardContent>
        </Card>

        {/* Bowling Stats */}
        <Card className="bg-[var(--color-surface)] border-[var(--color-border)] shadow-lg overflow-hidden">
          <div className="bg-blue-500/10 p-4 border-b border-[var(--color-border)] flex items-center gap-3">
            <Activity className="text-blue-400" size={20} />
            <h2 className="font-bold text-lg text-white">Bowling Statistics</h2>
          </div>
          <CardContent className="p-0">
            <div className="grid grid-cols-2 divide-x divide-y divide-[var(--color-border)]">
              <StatBox label="Wickets" value={playerData.totalWickets} valueColor="text-blue-400" />
              <StatBox label="Economy" value={playerData.economy.toFixed(2)} />
              <StatBox label="Average" value={playerData.bowlingAvg.toFixed(2)} />
              <StatBox label="Best Bowling" value={playerData.bestBowling || '-'} />
            </div>
          </CardContent>
        </Card>

        {/* Fielding Stats */}
        <Card className="bg-[var(--color-surface)] border-[var(--color-border)] shadow-lg overflow-hidden lg:col-span-1">
          <div className="bg-green-500/10 p-4 border-b border-[var(--color-border)] flex items-center gap-3">
            <Shield className="text-green-400" size={20} />
            <h2 className="font-bold text-lg text-white">Fielding</h2>
          </div>
          <CardContent className="p-0">
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 divide-y sm:divide-y-0 sm:divide-x lg:divide-x-0 lg:divide-y divide-[var(--color-border)]">
              <StatBox label="Catches" value={playerData.totalCatches} />
              <StatBox label="Run Outs" value={playerData.totalRunOuts} />
              <StatBox label="Stumpings" value={playerData.totalStumpings} />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Matches */}
      <div className="mt-10">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <Trophy className="text-yellow-500" /> Recent Performances
        </h2>
        {playerData.battingCards?.length === 0 && playerData.bowlingCards?.length === 0 ? (
          <div className="text-center p-10 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)]">
            <p className="text-[var(--color-text-muted)]">No recent match data available.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {playerData.battingCards?.slice(0, 6).map((card: any) => (
              <div key={card.id} className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl hover:border-brand-500/50 transition-colors">
                <div className="text-xs text-[var(--color-text-muted)] mb-2 font-medium">
                  {card.innings?.match?.teamA?.shortName} vs {card.innings?.match?.teamB?.shortName}
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-2xl font-bold text-white">{card.runs}</span>
                    <span className="text-sm text-[var(--color-text-muted)] ml-1">({card.balls})</span>
                  </div>
                  <div className="text-xs font-semibold px-2 py-1 bg-brand-500/10 text-brand-400 rounded-md">
                    SR: {card.strikeRate.toFixed(1)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value, valueColor = "text-white" }: { label: string, value: string | number, valueColor?: string }) {
  return (
    <div className="p-5 flex flex-col justify-center items-center text-center">
      <div className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] font-semibold mb-1">{label}</div>
      <div className={`text-2xl font-bold ${valueColor}`}>{value}</div>
    </div>
  );
}
