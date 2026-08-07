import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Search, Plus, UserPlus, Shield, Activity, Minus } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import toast from 'react-hot-toast';
import { playerService } from '../../services/team.service';

interface SquadModalProps {
  team: any;
  onClose: () => void;
  onOpenCreatePlayer: (name: string) => void;
}

export function SquadModal({ team, onClose, onOpenCreatePlayer }: SquadModalProps) {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch players in the current team
  const { data: teamPlayersData, isLoading: loadingTeamPlayers } = useQuery({
    queryKey: ['team-players', team.id],
    queryFn: () => playerService.getPlayers({ teamId: team.id, limit: '100' }),
  });
  const teamPlayers = teamPlayersData?.players || [];

  // Fetch players matching the search
  const { data: searchResultsData, isLoading: searching } = useQuery({
    queryKey: ['search-players', debouncedSearch],
    queryFn: () => playerService.getPlayers({ search: debouncedSearch, limit: '5' }),
    enabled: debouncedSearch.length > 0,
  });
  const searchResults = searchResultsData?.players || [];

  const assignMutation = useMutation({
    mutationFn: (playerId: string) => playerService.transferPlayer(playerId, team.id),
    onSuccess: () => {
      toast.success('Player added to squad');
      qc.invalidateQueries({ queryKey: ['team-players', team.id] });
      qc.invalidateQueries({ queryKey: ['admin-teams'] });
    },
    onError: () => toast.error('Failed to assign player')
  });

  const removeMutation = useMutation({
    mutationFn: (playerId: string) => playerService.transferPlayer(playerId, null),
    onSuccess: () => {
      toast.success('Player removed from squad');
      qc.invalidateQueries({ queryKey: ['team-players', team.id] });
      qc.invalidateQueries({ queryKey: ['admin-teams'] });
    },
    onError: () => toast.error('Failed to remove player')
  });

  return (
    <motion.div className="bg-card rounded-2xl p-6 w-full max-w-2xl border border-border shadow-2xl max-h-[90vh] flex flex-col"
      initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}>
      
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h2 className="font-bold text-xl text-white tracking-tight flex items-center gap-2">
            {team.logo && <img src={team.logo} className="w-6 h-6 rounded-full" alt="logo" />}
            Manage Squad: {team.name}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Add or remove players from this team.</p>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-white transition-colors"><X size={20} /></button>
      </div>

      <div className="relative mb-6 flex-shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
        <Input 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          placeholder="Search by player name to add..."
          className="pl-9 bg-background/50" 
        />
        
        {/* Search Results Dropdown-style */}
        {debouncedSearch.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-border rounded-xl shadow-xl overflow-hidden z-10 flex flex-col max-h-[300px]">
            {searching ? (
              <div className="p-4 text-center text-muted-foreground text-sm">Searching...</div>
            ) : searchResults.length > 0 ? (
              <div className="overflow-y-auto">
                {searchResults.map((p: any) => (
                  <div key={p.id} className="p-3 border-b border-border hover:bg-slate-800/50 flex items-center justify-between transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold overflow-hidden">
                        {p.photo ? <img src={p.photo} alt={p.name} className="w-full h-full object-cover" /> : p.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-white flex items-center gap-2">
                          {p.name} 
                          {p.teamId === team.id && <Badge variant="success" className="text-[10px] h-4">In Squad</Badge>}
                          {p.teamId && p.teamId !== team.id && <Badge variant="secondary" className="text-[10px] h-4">In {p.team?.shortName || 'Another Team'}</Badge>}
                        </div>
                        <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1"><Shield size={12} /> {p.role.replace(/_/g, ' ')}</span>
                          <span className="flex items-center gap-1"><Activity size={12} /> Runs: {p.totalRuns} | W: {p.totalWickets}</span>
                        </div>
                      </div>
                    </div>
                    {p.teamId !== team.id && (
                      <Button size="sm" variant="default" onClick={() => assignMutation.mutate(p.id)} disabled={assignMutation.isPending}>
                        <UserPlus size={14} className="mr-1" /> Add
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center">
                <p className="text-muted-foreground text-sm mb-3">No registered players found matching "{search}"</p>
                <Button size="sm" onClick={() => onOpenCreatePlayer(search)} className="gap-2">
                  <Plus size={14} /> Create New Player
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto min-h-[200px] border rounded-xl border-border bg-background/30 p-2">
        <h3 className="font-semibold text-white px-2 py-2 mb-2 border-b border-border flex justify-between items-center">
          Current Squad
          <Badge variant="secondary">{teamPlayers.length} Players</Badge>
        </h3>
        
        {loadingTeamPlayers ? (
          <div className="p-8 text-center text-muted-foreground flex justify-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>
        ) : teamPlayers.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No players in this squad yet.</div>
        ) : (
          <div className="space-y-1">
            {teamPlayers.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/40 group transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-white text-xs overflow-hidden">
                    {p.photo ? <img src={p.photo} alt={p.name} className="w-full h-full object-cover" /> : p.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{p.name} {p.jerseyNumber && <span className="text-muted-foreground ml-1">#{p.jerseyNumber}</span>}</div>
                    <div className="text-[11px] text-muted-foreground">{p.role.replace(/_/g, ' ')}</div>
                  </div>
                </div>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => { if(confirm('Remove player from squad?')) removeMutation.mutate(p.id) }}>
                  <Minus size={14} />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
