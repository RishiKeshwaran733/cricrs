import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, X, Trophy } from 'lucide-react';
import toast from 'react-hot-toast';
import { tournamentService, teamService } from '../../services/team.service';

const FORMATS = ['T20', 'ODI', 'TEST', 'T10', 'THE_HUNDRED', 'CUSTOM'];

export default function AdminTournamentsPage() {
  const [showModal, setShowModal] = useState(false);
  const [editT, setEditT] = useState<any>(null);
  const [form, setForm] = useState({ name: '', shortName: '', description: '', startDate: '', endDate: '', format: 'T20', totalTeams: '8', venue: '' });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ['admin-tournaments'], queryFn: () => tournamentService.getTournaments({ limit: '50' }) });
  const { data: teamData } = useQuery({ queryKey: ['teams-list'], queryFn: () => teamService.getTeams({ limit: '100' }) });

  const tournaments = data?.tournaments || [];
  const teams = teamData?.teams || [];

  const openCreate = () => { setEditT(null); setForm({ name: '', shortName: '', description: '', startDate: '', endDate: '', format: 'T20', totalTeams: '8', venue: '' }); setLogoFile(null); setSelectedTeamIds([]); setShowModal(true); };

  const handleSave = async () => {
    if (!form.name || !form.startDate || !form.endDate) { toast.error('Name and dates required'); return; }
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    selectedTeamIds.forEach(id => fd.append('teamIds[]', id));
    if (logoFile) fd.append('logo', logoFile);
    try {
      if (editT) {
        await tournamentService.updateTournament(editT.id, fd);
        toast.success('Tournament updated');
      } else {
        await tournamentService.createTournament(fd);
        toast.success('Tournament created');
      }
      qc.invalidateQueries({ queryKey: ['admin-tournaments'] });
      setShowModal(false);
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this tournament?')) return;
    try { await tournamentService.deleteTournament(id); toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['admin-tournaments'] }); }
    catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-bold text-2xl">Tournaments</h1>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-medium"><Plus size={16} /> Create</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? [1,2,3].map(i => <div key={i} className="card skeleton h-40" />) :
          tournaments.map((t: any) => (
            <motion.div key={t.id} layout className="card p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-brand-600/20 flex items-center justify-center flex-shrink-0">
                  {t.logo ? <img src={t.logo} className="w-full h-full object-cover rounded-xl" /> : <Trophy size={16} className="text-brand-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate">{t.name}</div>
                  <div className="text-xs text-[var(--color-text-muted)]">{t.format} • {t.teams?.length || 0} teams</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleDelete(t.id)} className="flex-1 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-medium hover:bg-red-500/20 flex items-center justify-center gap-1">
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </motion.div>
          ))
        }
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="bg-[var(--color-surface)] rounded-2xl p-6 w-full max-w-lg border border-[var(--color-border)] max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
              <div className="flex justify-between mb-5">
                <h2 className="font-bold text-lg">Create Tournament</h2>
                <button onClick={() => setShowModal(false)}><X size={20} /></button>
              </div>
              <div className="space-y-4">
                {[{ label: 'Name *', key: 'name' }, { label: 'Short Name', key: 'shortName' }, { label: 'Venue', key: 'venue' }, { label: 'Description', key: 'description' }].map(f => (
                  <div key={f.key}>
                    <label className="block text-sm font-medium mb-1">{f.label}</label>
                    <input value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-sm focus:outline-none focus:border-brand-500" />
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Start Date *</label>
                    <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">End Date *</label>
                    <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Format</label>
                    <select value={form.format} onChange={e => setForm({ ...form, format: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-sm">
                      {FORMATS.map(f => <option key={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">No. of Teams</label>
                    <input type="number" value={form.totalTeams} onChange={e => setForm({ ...form, totalTeams: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Select Teams</label>
                  <div className="max-h-40 overflow-y-auto space-y-1 border border-[var(--color-border)] rounded-xl p-2">
                    {teams.map((t: any) => (
                      <label key={t.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--color-surface-2)] cursor-pointer">
                        <input type="checkbox" checked={selectedTeamIds.includes(t.id)} onChange={e => setSelectedTeamIds(prev => e.target.checked ? [...prev, t.id] : prev.filter(id => id !== t.id))}
                          className="accent-brand-500" />
                        <span className="text-sm">{t.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Logo</label>
                  <input type="file" accept="image/*" onChange={e => setLogoFile(e.target.files?.[0] || null)}
                    className="w-full text-sm text-[var(--color-text-muted)] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-brand-600 file:text-white file:text-xs" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-[var(--color-border)] text-sm">Cancel</button>
                  <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium">Create</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
