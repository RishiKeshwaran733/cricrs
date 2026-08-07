import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { teamService, playerService } from '../../services/team.service';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { PlayerForm } from '../../components/admin/PlayerForm';

const BATTING_STYLES = ['RIGHT_HANDED', 'LEFT_HANDED'];
const BOWLING_STYLES = ['RIGHT_ARM_FAST', 'RIGHT_ARM_MEDIUM_FAST', 'RIGHT_ARM_MEDIUM', 'RIGHT_ARM_OFF_SPIN', 'RIGHT_ARM_LEG_SPIN', 'LEFT_ARM_FAST', 'LEFT_ARM_MEDIUM_FAST', 'LEFT_ARM_MEDIUM', 'LEFT_ARM_ORTHODOX', 'LEFT_ARM_CHINAMAN', 'NONE'];
const ROLES = ['BATSMAN', 'BOWLER', 'ALL_ROUNDER', 'WICKET_KEEPER', 'WICKET_KEEPER_BATSMAN'];

export default function AdminPlayersPage() {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editPlayer, setEditPlayer] = useState<any>(null);
  const [form, setForm] = useState({ name: '', mobileNumber: '', jerseyNumber: '', dateOfBirth: '', nationality: '', battingStyle: 'RIGHT_HANDED', bowlingStyle: 'NONE', role: 'BATSMAN', teamId: '', bio: '' });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const qc = useQueryClient();

  const { data: teamsData } = useQuery({ queryKey: ['teams-list'], queryFn: () => teamService.getTeams({ limit: '100' }) });

  const { data: playerPageData, isLoading } = useQuery({
    queryKey: ['admin-players-page', search],
    queryFn: () => playerService.getPlayers(search ? { search } : {}),
  });

  const players = playerPageData?.players || [];
  const teams = teamsData?.teams || [];

  const openCreate = () => { setEditPlayer(null); setForm({ name: '', mobileNumber: '', jerseyNumber: '', dateOfBirth: '', nationality: '', battingStyle: 'RIGHT_HANDED', bowlingStyle: 'NONE', role: 'BATSMAN', teamId: '', bio: '' }); setPhotoFile(null); setShowModal(true); };
  const openEdit = (p: any) => {
    setEditPlayer(p);
    setForm({ name: p.name, mobileNumber: p.mobileNumber || '', jerseyNumber: String(p.jerseyNumber || ''), dateOfBirth: p.dateOfBirth ? p.dateOfBirth.split('T')[0] : '', nationality: p.nationality || '', battingStyle: p.battingStyle, bowlingStyle: p.bowlingStyle, role: p.role, teamId: p.teamId || '', bio: p.bio || '' });
    setPhotoFile(null);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name) { toast.error('Player name is required'); return; }
    if (!form.mobileNumber || !/^\d{10}$/.test(form.mobileNumber)) {
      toast.error('Mobile Number must be exactly 10 digits');
      return;
    }
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v as string));
    if (photoFile) fd.append('photo', photoFile);
    try {
      if (editPlayer) {
        await playerService.updatePlayer(editPlayer.id, fd);
        toast.success('Player updated');
      } else {
        await playerService.createPlayer(fd);
        toast.success('Player created');
      }
      qc.invalidateQueries({ queryKey: ['admin-players-page'] });
      setShowModal(false);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to save player');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this player?')) return;
    try {
      await playerService.deletePlayer(id);
      toast.success('Player deleted');
      qc.invalidateQueries({ queryKey: ['admin-players-page'] });
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Players</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage player profiles, stats, and team assignments.</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus size={16} /> Add Player
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                placeholder="Search players by name..."
                className="pl-9" 
              />
            </div>
            <Badge variant="secondary" className="hidden sm:inline-flex">{players.length} total</Badge>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">Avatar</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead className="hidden md:table-cell">Role</TableHead>
                  <TableHead className="hidden lg:table-cell">Batting Style</TableHead>
                  <TableHead className="hidden xl:table-cell">Bowling Style</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      <div className="flex justify-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>
                    </TableCell>
                  </TableRow>
                ) : players.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No players found.
                    </TableCell>
                  </TableRow>
                ) : (
                  players.map((player: any) => (
                    <TableRow key={player.id}>
                      <TableCell>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm bg-primary/20">
                          {player.photo ? <img src={player.photo} className="w-full h-full object-cover rounded-full" alt={player.name} /> : player.name.charAt(0)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-white">{player.name}</div>
                        <div className="text-xs text-muted-foreground">#{player.jerseyNumber || 'N/A'} • {player.nationality || 'Unknown'}</div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="secondary" className="text-xs font-normal">{player.role.replace(/_/g, ' ')}</Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                        {player.battingStyle.replace(/_/g, ' ')}
                      </TableCell>
                      <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">
                        {player.bowlingStyle === 'NONE' ? '—' : player.bowlingStyle.replace(/_/g, ' ')}
                      </TableCell>
                      <TableCell className="text-sm font-mono text-muted-foreground">
                        {player.mobileNumber || '—'}
                      </TableCell>
                      <TableCell>
                        {player.team ? (
                          <div className="flex items-center gap-2">
                            {player.team.logo && <img src={player.team.logo} className="w-5 h-5 rounded-full" alt="Team" />}
                            <span className="text-sm font-medium">{player.team.shortName}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(player)} className="h-8 w-8 text-muted-foreground hover:text-white">
                            <Edit2 size={16} />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(player.id)} className="h-8 w-8 text-muted-foreground hover:text-danger">
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

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <PlayerForm 
              form={form} 
              setForm={setForm} 
              setPhotoFile={setPhotoFile} 
              teams={teams} 
              isEdit={!!editPlayer} 
              onSave={handleSave} 
              onCancel={() => setShowModal(false)} 
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
