import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

const BATTING_STYLES = ['RIGHT_HANDED', 'LEFT_HANDED'];
const BOWLING_STYLES = ['RIGHT_ARM_FAST', 'RIGHT_ARM_MEDIUM_FAST', 'RIGHT_ARM_MEDIUM', 'RIGHT_ARM_OFF_SPIN', 'RIGHT_ARM_LEG_SPIN', 'LEFT_ARM_FAST', 'LEFT_ARM_MEDIUM_FAST', 'LEFT_ARM_MEDIUM', 'LEFT_ARM_ORTHODOX', 'LEFT_ARM_CHINAMAN', 'NONE'];
const ROLES = ['BATSMAN', 'BOWLER', 'ALL_ROUNDER', 'WICKET_KEEPER', 'WICKET_KEEPER_BATSMAN'];

interface PlayerFormProps {
  form: any;
  setForm: (form: any) => void;
  setPhotoFile: (file: File | null) => void;
  teams: any[];
  isEdit: boolean;
  onSave: () => void;
  onCancel: () => void;
}

export function PlayerForm({ form, setForm, setPhotoFile, teams, isEdit, onSave, onCancel }: PlayerFormProps) {
  return (
    <motion.div className="bg-card rounded-2xl p-6 w-full max-w-xl border border-border max-h-[90vh] overflow-y-auto shadow-2xl"
      initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-bold text-xl text-white tracking-tight">{isEdit ? 'Edit Player' : 'Add Player'}</h2>
        <button onClick={onCancel} className="text-muted-foreground hover:text-white transition-colors"><X size={20} /></button>
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Player Name *', key: 'name', type: 'text', placeholder: 'Full name' },
            { label: 'Mobile Number *', key: 'mobileNumber', type: 'text', placeholder: '10 digit number' },
            { label: 'Jersey Number', key: 'jerseyNumber', type: 'number', placeholder: 'e.g. 18' },
            { label: 'Date of Birth', key: 'dateOfBirth', type: 'date', placeholder: '' },
            { label: 'Nationality', key: 'nationality', type: 'text', placeholder: 'e.g. Indian' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">{f.label}</label>
              <Input type={f.type} value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder} />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Role', key: 'role', options: ROLES },
            { label: 'Batting Style', key: 'battingStyle', options: BATTING_STYLES },
            { label: 'Bowling Style', key: 'bowlingStyle', options: BOWLING_STYLES },
          ].map(s => (
            <div key={s.key}>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">{s.label}</label>
              <select value={(form as any)[s.key]} onChange={e => setForm({ ...form, [s.key]: e.target.value })}
                className="w-full h-10 px-3 py-2 rounded-xl bg-background border border-border text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary appearance-none">
                {s.options.map(o => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Team Assignment</label>
            <select value={form.teamId} onChange={e => setForm({ ...form, teamId: e.target.value })}
              className="w-full h-10 px-3 py-2 rounded-xl bg-background border border-border text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary appearance-none">
              <option value="">No team (Free Agent)</option>
              {teams.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Profile Photo</label>
            <Input type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files?.[0] || null)}
              className="file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90" />
          </div>
        </div>

        <div className="flex gap-3 pt-6">
          <Button variant="outline" className="flex-1" onClick={onCancel}>Cancel</Button>
          <Button className="flex-1" onClick={onSave}>{isEdit ? 'Save Changes' : 'Create Player'}</Button>
        </div>
      </div>
    </motion.div>
  );
}
