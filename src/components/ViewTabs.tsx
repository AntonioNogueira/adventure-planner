import React from 'react';
import { Route as RouteIcon, Wallet, FolderOpen } from 'lucide-react';
import { cn } from '../lib/utils';

export type AppView = 'route' | 'budget' | 'documents';

const TABS: { id: AppView; label: string; icon: typeof RouteIcon }[] = [
  { id: 'route', label: 'Route', icon: RouteIcon },
  { id: 'budget', label: 'Budget', icon: Wallet },
  { id: 'documents', label: 'Documents', icon: FolderOpen },
];

/** The switch above the map: Route (the map), Budget and Documents. */
const ViewTabs: React.FC<{ view: AppView; onChange: (view: AppView) => void; documentCount: number }> = ({ view, onChange, documentCount }) => (
  <nav
    aria-label="Views"
    className="absolute left-1/2 top-3 z-20 flex -translate-x-1/2 gap-1 rounded-xl border border-white/20 bg-white/90 p-1 shadow-xl backdrop-blur-md md:top-6"
  >
    {TABS.map(({ id, label, icon: Icon }) => (
      <button
        key={id}
        onClick={() => onChange(id)}
        aria-pressed={view === id}
        className={cn(
          'flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-all',
          view === id ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : 'text-muted-foreground hover:bg-emerald-50 hover:text-emerald-700',
        )}
      >
        <Icon size={14} />
        {label}
        {id === 'documents' && documentCount > 0 && (
          <span className={cn('rounded-full px-1.5 text-[10px]', view === id ? 'bg-white/25' : 'bg-violet-100 text-violet-700')}>{documentCount}</span>
        )}
      </button>
    ))}
  </nav>
);

export default ViewTabs;
