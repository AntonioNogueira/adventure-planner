// "Your travel profile" in Settings: what the planner has learned about how you travel, used as defaults for new
// trips, with a button to forget it.
import React, { useSyncExternalStore } from 'react';
import { useSettings } from '../lib/settings';
import { forgetProfile, getProfile, hasProfile, onProfileChange } from '../lib/profile';

const MODE_LABELS: Record<string, string> = { BICYCLING: 'Bike', WALKING: 'On foot', DRIVING: 'Moto / car' };
const RIDE_LABELS: Record<string, string> = { road: 'road bike', gravel: 'gravel', mtb: 'mountain bike', emtb: 'e-MTB', touring: 'touring', adventure: 'adventure', enduro: 'enduro' };
const LODGING_LABELS: Record<string, string> = { camping: 'camping', hostel: 'hostels', hotel: 'hotels' };
const PARTY_LABELS: Record<string, string> = { solo: 'on your own', couple: 'as a couple', family: 'with the family', group: 'with a group' };
const BUDGET_LABELS: Record<string, string> = { shoestring: 'on a shoestring', mid: 'mid-range', comfort: 'comfort' };

const TravelProfile: React.FC = () => {
  const { t, dist } = useSettings();
  const profile = useSyncExternalStore(onProfileChange, getProfile, getProfile);
  if (!hasProfile(profile)) {
    return <p className="text-[10px] text-muted-foreground">{t('Your travel profile: the planner learns how you like to travel from your trips and uses it next time.')}</p>;
  }
  return (
    <div className="space-y-1 rounded-md bg-emerald-50/60 p-2 text-[11px]">
      <p className="font-semibold text-slate-700">{t('Your travel profile')}</p>
      {Object.entries(profile.modes).map(([mode, h]) => h && (
        <p key={mode} className="text-slate-600">
          <span className="font-semibold">{t(MODE_LABELS[mode] || mode)}</span>
          {' · '}
          {[h.vehicleModel || (h.ride && t(RIDE_LABELS[h.ride] || h.ride)), h.dailyKm && t('{d} a day', { d: dist(h.dailyKm, 0) }),
            h.lodging && t(LODGING_LABELS[h.lodging] || h.lodging), h.party && t(PARTY_LABELS[h.party] || h.party),
            h.budgetStyle && t(BUDGET_LABELS[h.budgetStyle] || h.budgetStyle)].filter(Boolean).join(' · ') || t('learning…')}
          <span className="text-slate-400"> ({t('{n} trips', { n: h.trips })})</span>
        </p>
      ))}
      {profile.notes.length > 0 && <p className="text-slate-600">“{profile.notes.slice(0, 4).join('”, “')}”</p>}
      <button onClick={() => { if (window.confirm(t('Forget everything the planner has learned about how you travel?'))) forgetProfile(); }}
        className="font-semibold text-red-600 hover:underline">{t('Forget my profile')}</button>
    </div>
  );
};

export default TravelProfile;
