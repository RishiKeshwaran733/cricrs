import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileBarChart, Download, Users, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { matchService } from '../../services/match.service';
import { playerService } from '../../services/team.service';

export default function AdminReportsPage() {
  const [matchId, setMatchId] = useState('');
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);

  const { data: matchData, isLoading: isLoadingMatches } = useQuery({
    queryKey: ['admin-matches-reports'],
    queryFn: () => matchService.getMatches({ limit: '100' }),
  });

  const { data: playerData, isLoading: isLoadingPlayers } = useQuery({
    queryKey: ['admin-players-reports'],
    queryFn: () => playerService.getPlayers({ limit: '1000' }),
  });

  const matches = matchData?.matches || [];
  const players = playerData?.players || [];

  const API_URL = import.meta.env.VITE_BACKEND_URL;

  const handleExportPlayers = (format: string) => {
    let url = `${API_URL}/api/reports/players?format=${format}`;
    if (selectedPlayerIds.length > 0) {
      url += `&playerIds=${selectedPlayerIds.join(',')}`;
    }
    window.open(url, '_blank');
  };

  const handleExportMatch = (endpoint: string, format: string) => {
    window.open(`${API_URL}/api/reports/${endpoint}?format=${format}`, '_blank');
  };

  const togglePlayer = (id: string) => {
    setSelectedPlayerIds(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Reports & Export</h1>
        <p className="text-sm text-muted-foreground mt-1">Generate PDF, Excel, and CSV reports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Players Export */}
        <Card className="border-border shadow-xl">
          <CardHeader>
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4">
              <Users size={24} className="text-purple-400" />
            </div>
            <CardTitle className="text-xl">Global Player Statistics</CardTitle>
            <p className="text-sm text-muted-foreground">Export career stats, averages, and strike rates for players.</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoadingPlayers ? (
                <div className="text-sm text-muted-foreground animate-pulse">Loading players...</div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-white">Select Players</span>
                    <button 
                      onClick={() => setSelectedPlayerIds(selectedPlayerIds.length === players.length ? [] : players.map((p: any) => p.id))}
                      className="text-brand-400 hover:text-brand-300 text-xs"
                    >
                      {selectedPlayerIds.length === players.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  <div className="h-32 overflow-y-auto border border-border rounded-xl p-2 bg-background/50 space-y-1">
                    {players.map((p: any) => (
                      <label key={p.id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-surface cursor-pointer text-sm">
                        <input 
                          type="checkbox" 
                          className="accent-brand-500 w-4 h-4" 
                          checked={selectedPlayerIds.includes(p.id)}
                          onChange={() => togglePlayer(p.id)}
                        />
                        <span className="truncate text-white">{p.name} {p.team ? `(${p.team.shortName})` : ''}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {selectedPlayerIds.length > 0 ? `${selectedPlayerIds.length} player(s) selected` : 'All players will be exported if none are selected'}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-3 mt-4">
                <Button onClick={() => handleExportPlayers('pdf')} variant="outline" className="flex-1 gap-2 border-danger/50 hover:bg-danger/10 text-danger hover:text-danger">
                  <Download size={16} /> PDF
                </Button>
                <Button onClick={() => handleExportPlayers('excel')} variant="outline" className="flex-1 gap-2 border-success/50 hover:bg-success/10 text-success hover:text-success">
                  <Download size={16} /> Excel
                </Button>
                <Button onClick={() => handleExportPlayers('csv')} variant="outline" className="flex-1 gap-2 border-primary/50 hover:bg-primary/10 text-primary hover:text-primary">
                  <Download size={16} /> CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Match Export */}
        <Card className="border-border shadow-xl">
          <CardHeader>
            <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center mb-4">
              <Trophy size={24} className="text-brand-400" />
            </div>
            <CardTitle className="text-xl">Match Scorecard Export</CardTitle>
            <p className="text-sm text-muted-foreground">Export full ball-by-ball scorecards for a specific match.</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoadingMatches ? (
                <div className="text-sm text-muted-foreground animate-pulse">Loading matches...</div>
              ) : (
                <select 
                  value={matchId} 
                  onChange={e => setMatchId(e.target.value)}
                  className="w-full h-10 px-3 py-2 rounded-xl bg-background border border-border text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
                >
                  <option value="">-- Select a Match --</option>
                  {matches?.map((m: any) => (
                    <option key={m.id} value={m.id}>
                      {m.teamA.shortName} vs {m.teamB.shortName} ({new Date(m.scheduledAt).toLocaleDateString()}) - {m.status}
                    </option>
                  ))}
                </select>
              )}
              <div className="flex flex-wrap gap-3">
                <Button disabled={!matchId} onClick={() => handleExportMatch(`match/${matchId}`, 'pdf')} variant="outline" className="flex-1 gap-2 border-danger/50 hover:bg-danger/10 text-danger hover:text-danger">
                  <Download size={16} /> PDF
                </Button>
                <Button disabled={!matchId} onClick={() => handleExportMatch(`match/${matchId}`, 'excel')} variant="outline" className="flex-1 gap-2 border-success/50 hover:bg-success/10 text-success hover:text-success">
                  <Download size={16} /> Excel
                </Button>
                <Button disabled={!matchId} onClick={() => handleExportMatch(`match/${matchId}`, 'csv')} variant="outline" className="flex-1 gap-2 border-primary/50 hover:bg-primary/10 text-primary hover:text-primary">
                  <Download size={16} /> CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
