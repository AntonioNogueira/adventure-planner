import React, { useEffect } from 'react';
import { X, Navigation, Clock, Trash2, ArrowRight } from 'lucide-react';
import { RouteInfo } from '../types';

interface SavedRoutesProps {
  routes: RouteInfo[];
  onClose: () => void;
  onLoad: (route: RouteInfo) => void;
  onDelete: (id: string) => void;
}

const SavedRoutes: React.FC<SavedRoutesProps> = ({ routes, onClose, onLoad, onDelete }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const sorted = [...routes].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Saved Expeditions" onClick={(e) => e.stopPropagation()} className="flex max-h-[85dvh] min-h-[320px] w-full max-w-2xl flex-col rounded-2xl bg-card shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-emerald-100 p-4 sm:p-6">
          <h2 className="text-xl font-bold text-emerald-950">Saved Expeditions</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-2 hover:bg-emerald-50">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {routes.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
              <Navigation size={48} className="mb-4 opacity-10" />
              <p>No expeditions saved yet.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {sorted.map((route) => (
                <div 
                  key={route.id} 
                  className="group relative rounded-xl border border-emerald-100 bg-background p-4 transition-all hover:border-emerald-500/50 hover:shadow-md"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex flex-col">
                      {route.name && (
                        <h3 className="text-sm font-bold text-emerald-950 mb-1">
                          {route.name}
                        </h3>
                      )}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 text-sm font-bold text-emerald-600">
                          <Clock size={14} />
                          {route.duration}
                        </div>
                        <div className="text-sm font-medium text-muted-foreground">
                          {route.distance}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onLoad(route)}
                        className="rounded-lg bg-emerald-600/10 px-3 py-1 text-xs font-bold text-emerald-600 hover:bg-emerald-600 hover:text-white transition-colors"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete "${route.name || 'this expedition'}"?`)) onDelete(route.id!);
                        }}
                        aria-label="Delete expedition"
                        className="rounded-lg p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 truncate text-sm font-medium">
                      {route.origin.split(',')[0]}
                    </div>
                    <ArrowRight size={14} className="text-muted-foreground" />
                    <div className="flex-1 truncate text-sm font-medium">
                      {route.destination.split(',')[0]}
                    </div>
                  </div>
                  
                  {route.waypoints.length > 0 && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      via {route.waypoints.length} stop{route.waypoints.length > 1 ? 's' : ''}
                      {route.createdAt ? ` · saved ${new Date(route.createdAt).toLocaleDateString()}` : ''}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SavedRoutes;
