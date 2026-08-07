import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { teamService } from '../services/team.service';

export default function TeamsPage() {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['teams', search],
    queryFn: () => teamService.getTeams(search ? { search } : {}),
  });
  const teams = data?.teams || [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-24 lg:pb-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="font-display font-bold text-2xl">Teams</h1>
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={16} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search teams..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-sm focus:outline-none focus:border-brand-500" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {isLoading ? [1,2,3,4,5,6].map(i => <div key={i} className="card skeleton h-32" />) :
          teams.map((team: any) => (
            <motion.div key={team.id} whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
              <Link to={`/teams/${team.id}`} className="card card-hover p-5 flex items-center gap-4 block">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0"
                  style={{ background: team.primaryColor || '#1e293b' }}>
                  {team.logo ? <img src={team.logo} className="w-full h-full object-cover rounded-2xl" /> : team.shortName.substring(0,2)}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-[var(--color-text)] truncate">{team.name}</div>
                  <div className="text-xs text-[var(--color-text-muted)]">{team.shortName}</div>
                  <div className="text-xs text-[var(--color-text-muted)] mt-1">{team._count?.players || 0} players</div>
                </div>
              </Link>
            </motion.div>
          ))
        }
      </div>
    </div>
  );
}
