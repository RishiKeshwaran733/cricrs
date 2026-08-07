import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Search, X, MoreHorizontal } from 'lucide-react';
import toast from 'react-hot-toast';
import { teamService } from '../../services/team.service';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { SquadModal } from '../../components/admin/SquadModal';
import { PlayerForm } from '../../components/admin/PlayerForm';
import { playerService } from '../../services/team.service';

export default function AdminTeamsPage() {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editTeam, setEditTeam] = useState<any>(null);
  const [form, setForm] = useState({ name: '', shortName: '', primaryColor: '#1a1a2e', secondaryColor: '#ffffff', country: '', city: '', homeGround: '' });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  
  // Squad / Player Form State
  const [manageSquadTeam, setManageSquadTeam] = useState<any>(null);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [playerForm, setPlayerForm] = useState({ name: '', jerseyNumber: '', dateOfBirth: '', nationality: '', battingStyle: 'RIGHT_HANDED', bowlingStyle: 'NONE', role: 'BATSMAN', teamId: '', bio: '' });
  const [playerPhotoFile, setPlayerPhotoFile] = useState<File | null>(null);

  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-teams', search],
    queryFn: () => teamService.getTeams(search ? { search } : {}),
  });
  const teams = data?.teams || [];

  const openCreate = () => { setEditTeam(null); setForm({ name: '', shortName: '', primaryColor: '#1a1a2e', secondaryColor: '#ffffff', country: '', city: '', homeGround: '' }); setLogoFile(null); setShowModal(true); };
  const openEdit = (t: any) => {
    setEditTeam(t);
    setForm({ name: t.name, shortName: t.shortName, primaryColor: t.primaryColor, secondaryColor: t.secondaryColor, country: t.country || '', city: t.city || '', homeGround: t.homeGround || '' });
    setLogoFile(null);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.shortName) { toast.error('Name and short name required'); return; }
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (logoFile) fd.append('logo', logoFile);
    try {
      if (editTeam) {
        await teamService.updateTeam(editTeam.id, fd);
        toast.success('Team updated');
      } else {
        await teamService.createTeam(fd);
        toast.success('Team created');
      }
      qc.invalidateQueries({ queryKey: ['admin-teams'] });
      setShowModal(false);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to save');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this team?')) return;
    try {
      await teamService.deleteTeam(id);
      toast.success('Team deleted');
      qc.invalidateQueries({ queryKey: ['admin-teams'] });
    } catch { toast.error('Failed to delete'); }
  };

  const handleCreatePlayer = async () => {
    if (!playerForm.name) { toast.error('Player name is required'); return; }
    const fd = new FormData();
    Object.entries(playerForm).forEach(([k, v]) => fd.append(k, v));
    if (playerPhotoFile) fd.append('photo', playerPhotoFile);
    try {
      await playerService.createPlayer(fd);
      toast.success('Player created & assigned!');
      setShowPlayerModal(false);
      qc.invalidateQueries({ queryKey: ['team-players', manageSquadTeam?.id] });
      qc.invalidateQueries({ queryKey: ['admin-teams'] });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to create player');
    }
  };

  const openSquad = (t: any) => setManageSquadTeam(t);
  
  const openCreatePlayerFromSquad = (name: string) => {
    setPlayerForm({ name, jerseyNumber: '', dateOfBirth: '', nationality: '', battingStyle: 'RIGHT_HANDED', bowlingStyle: 'NONE', role: 'BATSMAN', teamId: manageSquadTeam.id, bio: '' });
    setPlayerPhotoFile(null);
    setShowPlayerModal(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Teams</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage cricket teams, logos, and squad information.</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus size={16} /> Add Team
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
                placeholder="Search teams by name or code..."
                className="pl-9" 
              />
            </div>
            <Badge variant="secondary" className="hidden sm:inline-flex">{teams.length} total</Badge>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Logo</TableHead>
                  <TableHead>Team Name</TableHead>
                  <TableHead className="hidden md:table-cell">Captain</TableHead>
                  <TableHead>Players</TableHead>
                  <TableHead className="hidden lg:table-cell">Matches</TableHead>
                  <TableHead>Status</TableHead>
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
                ) : teams.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No teams found.
                    </TableCell>
                  </TableRow>
                ) : (
                  teams.map((team: any) => (
                    <TableRow key={team.id}>
                      <TableCell>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm" style={{ background: team.primaryColor }}>
                          {team.logo ? <img src={team.logo} className="w-full h-full object-cover rounded-full" alt={team.shortName} /> : team.shortName.substring(0,2)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-white">{team.name}</div>
                        <div className="text-xs text-muted-foreground">{team.shortName} • {team.country || 'No Country'}</div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                        TBD
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{team._count?.players || 0}</Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                        0
                      </TableCell>
                      <TableCell>
                        <Badge variant="success">Active</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => openSquad(team)} className="h-8">
                            Manage Squad
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(team)} className="h-8 w-8 text-muted-foreground hover:text-white">
                            <Edit2 size={16} />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(team.id)} className="h-8 w-8 text-muted-foreground hover:text-danger">
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
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="bg-card rounded-2xl p-6 w-full max-w-md border border-border shadow-2xl"
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-xl text-white tracking-tight">{editTeam ? 'Edit Team' : 'Create Team'}</h2>
                <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-white transition-colors"><X size={20} /></button>
              </div>
              <div className="space-y-4">
                {[
                  { label: 'Team Name *', key: 'name', placeholder: 'e.g. Mumbai Indians' },
                  { label: 'Short Name *', key: 'shortName', placeholder: 'e.g. MI' },
                  { label: 'Country', key: 'country', placeholder: 'e.g. India' },
                  { label: 'City', key: 'city', placeholder: 'e.g. Mumbai' },
                  { label: 'Home Ground', key: 'homeGround', placeholder: 'e.g. Wankhede Stadium' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-sm font-medium mb-1.5 text-muted-foreground">{f.label}</label>
                    <Input value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder} />
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Primary Color</label>
                    <div className="flex items-center gap-2">
                       <input type="color" value={form.primaryColor} onChange={e => setForm({ ...form, primaryColor: e.target.value })}
                        className="w-10 h-10 rounded cursor-pointer border-0 p-0" />
                       <Input value={form.primaryColor} onChange={e => setForm({ ...form, primaryColor: e.target.value })} className="uppercase" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Secondary Color</label>
                    <div className="flex items-center gap-2">
                       <input type="color" value={form.secondaryColor} onChange={e => setForm({ ...form, secondaryColor: e.target.value })}
                        className="w-10 h-10 rounded cursor-pointer border-0 p-0" />
                       <Input value={form.secondaryColor} onChange={e => setForm({ ...form, secondaryColor: e.target.value })} className="uppercase" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Team Logo</label>
                  <Input type="file" accept="image/*" onChange={e => setLogoFile(e.target.files?.[0] || null)}
                    className="file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90" />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
                  <Button className="flex-1" onClick={handleSave}>{editTeam ? 'Save Changes' : 'Create Team'}</Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {manageSquadTeam && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <SquadModal 
              team={manageSquadTeam} 
              onClose={() => setManageSquadTeam(null)} 
              onOpenCreatePlayer={openCreatePlayerFromSquad} 
            />
          </div>
        )}

        {showPlayerModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <PlayerForm 
              form={playerForm} 
              setForm={setPlayerForm} 
              setPhotoFile={setPlayerPhotoFile} 
              teams={teams} 
              isEdit={false} 
              onSave={handleCreatePlayer} 
              onCancel={() => setShowPlayerModal(false)} 
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
