import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, X, Play, Calendar as CalendarIcon, MapPin, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { matchService } from '../../services/match.service';
import { teamService, tournamentService } from '../../services/team.service';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "success" | "warning" | "outline"> = {
  UPCOMING: 'warning',
  LIVE: 'destructive',
  PAUSED: 'warning',
  COMPLETED: 'success',
  ABANDONED: 'secondary',
};

const FORMATS = ['T20', 'ODI', 'TEST', 'T10', 'THE_HUNDRED', 'CUSTOM'];

export default function AdminMatchesPage() {
  const [showModal, setShowModal] = useState(false);
  const [showStartModal, setShowStartModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [form, setForm] = useState({ teamAId: '', teamBId: '', venue: '', scheduledAt: '', format: 'T20', totalOvers: '20', tournamentId: '', umpire1: '', umpire2: '', thirdUmpire: '', matchReferee: '' });
  const [isTeamBGuest, setIsTeamBGuest] = useState(false);
  const [guestTeamBName, setGuestTeamBName] = useState('');
  const [startForm, setStartForm] = useState({ tossWinnerId: '', tossDecision: 'BAT', battingTeamId: '', bowlingTeamId: '' });
  const qc = useQueryClient();

  const { data: matchData, isLoading } = useQuery({
    queryKey: ['admin-matches'],
    queryFn: () => matchService.getMatches({ limit: '50' }),
  });

  const { data: teamData } = useQuery({ queryKey: ['teams-list'], queryFn: () => teamService.getTeams({ limit: '100' }) });
  const { data: tourneyData } = useQuery({ queryKey: ['tournaments-list'], queryFn: () => tournamentService.getTournaments({ limit: '50' }) });

  const matches = matchData?.matches || [];
  const teams = teamData?.teams || [];
  const tournaments = tourneyData?.tournaments || [];

  const handleCreate = async () => {
    if (!form.teamAId || (!form.teamBId && !isTeamBGuest) || !form.scheduledAt) { toast.error('Teams and date required'); return; }
    try {
      const res = await matchService.createMatch({ ...form, totalOvers: Number(form.totalOvers), isTeamBGuest, guestTeamBName });
      toast.success(
        <div>
          Match created!<br/>
          <span className="text-xs font-mono opacity-80">ID: {res.id || res.match?.id}</span>
        </div>, 
        { duration: 8000 }
      );
      qc.invalidateQueries({ queryKey: ['admin-matches'] });
      setShowModal(false);
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed'); }
  };
  const openEdit = (match: any) => {
    toast.error('Edit functionality coming soon');
  };

  const handleStartMatch = async () => {
    if (!startForm.battingTeamId || !startForm.bowlingTeamId) { toast.error('Select batting and bowling teams'); return; }
    try {
      await matchService.startMatch(selectedMatch.id, startForm);
      toast.success('Match started!');
      qc.invalidateQueries({ queryKey: ['admin-matches'] });
      setShowStartModal(false);
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed to start match'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this match?')) return;
    try {
      await matchService.deleteMatch(id);
      toast.success('Match deleted');
      qc.invalidateQueries({ queryKey: ['admin-matches'] });
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Matches</h1>
          <p className="text-sm text-muted-foreground mt-1">Schedule matches, start games, and manage scoring.</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="gap-2">
          <Plus size={16} /> Create Match
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Match Details</TableHead>
                  <TableHead className="hidden sm:table-cell">Date & Time</TableHead>
                  <TableHead className="hidden md:table-cell">Format</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      <div className="flex justify-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>
                    </TableCell>
                  </TableRow>
                ) : matches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No matches scheduled.
                    </TableCell>
                  </TableRow>
                ) : (
                  matches.map((match: any) => (
                    <TableRow key={match.id}>
                      <TableCell>
                        <div className="font-semibold text-white flex items-center gap-2">
                          {match.teamA.shortName} <span className="text-muted-foreground text-xs font-normal">vs</span> {match.teamB.shortName}
                        </div>
                        {match.venue && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <MapPin size={12} /> {match.venue}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <CalendarIcon size={14} />
                          {new Date(match.scheduledAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline">{match.format}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANTS[match.status] || 'secondary'} className="relative">
                          {match.status}
                          {match.status === 'LIVE' && (
                            <span className="absolute -right-1 -top-1 flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
                            </span>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {match.status === 'UPCOMING' && (
                            <Button variant="default" size="sm" onClick={() => { setSelectedMatch(match); setStartForm({ tossWinnerId: match.teamAId, tossDecision: 'BAT', battingTeamId: match.teamAId, bowlingTeamId: match.teamBId }); setShowStartModal(true); }} className="gap-1 bg-success hover:bg-success/90 text-white">
                              <Play size={14} /> Start
                            </Button>
                          )}
                          {['LIVE', 'PAUSED', 'RAIN_DELAY'].includes(match.status) && match.innings?.[0] && (
                            <Link to={`/admin/scoring/${match.id}`}>
                              <Button variant={match.status === 'LIVE' ? 'destructive' : 'default'} size="sm" className="font-bold text-white">
                                {match.status === 'LIVE' ? 'Score' : 'Resume'}
                              </Button>
                            </Link>
                          )}
                          {['COMPLETED', 'ABANDONED'].includes(match.status) && (
                            <Link to={`/match/${match.id}`}>
                              <Button variant="outline" size="sm">View</Button>
                            </Link>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => openEdit(match)} className="text-muted-foreground hover:text-white">
                            <Edit2 size={16} />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(match.id)} className="text-muted-foreground hover:text-danger">
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Match Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="bg-card rounded-2xl p-6 w-full max-w-2xl border border-border max-h-[90vh] overflow-y-auto shadow-2xl"
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-bold text-xl text-white tracking-tight">Create Match</h2>
                <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-white transition-colors"><X size={20} /></button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Team A *</label>
                    <select value={form.teamAId} onChange={e => setForm({ ...form, teamAId: e.target.value })}
                      className="w-full h-10 px-3 py-2 rounded-xl bg-background border border-border text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary appearance-none">
                      <option value="">Select team</option>
                      {teams.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-sm font-medium text-muted-foreground">Team B *</label>
                      <label className="flex items-center text-xs text-muted-foreground cursor-pointer">
                        <input type="checkbox" className="mr-1.5 rounded border-border" checked={isTeamBGuest} onChange={e => setIsTeamBGuest(e.target.checked)} />
                        Guest Team
                      </label>
                    </div>
                    {isTeamBGuest ? (
                      <Input placeholder="Guest Team Name (e.g. Street Boys)" value={guestTeamBName} onChange={e => setGuestTeamBName(e.target.value)} className="w-full h-10" />
                    ) : (
                      <select value={form.teamBId} onChange={e => setForm({ ...form, teamBId: e.target.value })}
                        className="w-full h-10 px-3 py-2 rounded-xl bg-background border border-border text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary appearance-none">
                        <option value="">Select team</option>
                        {teams.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Tournament (optional)</label>
                  <select value={form.tournamentId} onChange={e => setForm({ ...form, tournamentId: e.target.value })}
                    className="w-full h-10 px-3 py-2 rounded-xl bg-background border border-border text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary appearance-none">
                    <option value="">None (Friendly Match)</option>
                    {tournaments.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[{ label: 'Venue', key: 'venue', type: 'text' }, { label: 'Date & Time *', key: 'scheduledAt', type: 'datetime-local' }].map(f => (
                    <div key={f.key}>
                      <label className="block text-sm font-medium mb-1.5 text-muted-foreground">{f.label}</label>
                      <Input type={f.type} value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Format</label>
                    <select value={form.format} onChange={e => setForm({ ...form, format: e.target.value })}
                      className="w-full h-10 px-3 py-2 rounded-xl bg-background border border-border text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary appearance-none">
                      {FORMATS.map(f => <option key={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Overs</label>
                    <Input type="number" value={form.totalOvers} onChange={e => setForm({ ...form, totalOvers: e.target.value })} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[{ label: 'Umpire 1', key: 'umpire1' }, { label: 'Umpire 2', key: 'umpire2' }, { label: 'Third Umpire', key: 'thirdUmpire' }, { label: 'Match Referee', key: 'matchReferee' }].map(f => (
                    <div key={f.key}>
                      <label className="block text-sm font-medium mb-1.5 text-muted-foreground">{f.label}</label>
                      <Input value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 pt-6">
                  <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
                  <Button className="flex-1" onClick={handleCreate}>Create Match</Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Start Match Modal */}
      <AnimatePresence>
        {showStartModal && selectedMatch && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="bg-card rounded-2xl p-6 w-full max-w-md border border-border shadow-2xl"
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-bold text-xl text-white tracking-tight">Start Match</h2>
                <button onClick={() => setShowStartModal(false)} className="text-muted-foreground hover:text-white transition-colors"><X size={20} /></button>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Toss Winner</label>
                  <select value={startForm.tossWinnerId} onChange={e => setStartForm({ ...startForm, tossWinnerId: e.target.value })}
                    className="w-full h-10 px-3 py-2 rounded-xl bg-background border border-border text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary appearance-none">
                    <option value={selectedMatch.teamAId}>{selectedMatch.teamA.name}</option>
                    <option value={selectedMatch.teamBId}>{selectedMatch.teamB.name}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Toss Decision</label>
                  <select value={startForm.tossDecision} onChange={e => setStartForm({ ...startForm, tossDecision: e.target.value })}
                    className="w-full h-10 px-3 py-2 rounded-xl bg-background border border-border text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary appearance-none">
                    <option value="BAT">Bat First</option>
                    <option value="BOWL">Bowl First</option>
                  </select>
                </div>
                <div className="pt-2 border-t border-border">
                  <label className="block text-sm font-medium mb-1.5 text-white">Batting Team (1st innings)</label>
                  <select value={startForm.battingTeamId} onChange={e => setStartForm({ ...startForm, battingTeamId: e.target.value, bowlingTeamId: e.target.value === selectedMatch.teamAId ? selectedMatch.teamBId : selectedMatch.teamAId })}
                    className="w-full h-10 px-3 py-2 rounded-xl bg-primary/20 border border-primary/50 text-white font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-primary appearance-none">
                    <option value={selectedMatch.teamAId}>{selectedMatch.teamA.name}</option>
                    <option value={selectedMatch.teamBId}>{selectedMatch.teamB.name}</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-6">
                  <Button variant="outline" className="flex-1" onClick={() => setShowStartModal(false)}>Cancel</Button>
                  <Button variant="default" className="flex-1 gap-2 bg-success hover:bg-success/90 text-white" onClick={handleStartMatch}><Play size={16} /> Start Match</Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
