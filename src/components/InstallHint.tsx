import React, { useState } from 'react';
import { Smartphone, Share, X } from 'lucide-react';
import { useInstall } from '../lib/install';
import { useSettings } from '../lib/settings';

const DISMISSED = 'adventure-planner.install-hint';

/** "Install the app": a button where the browser offers it (Android, desktop Chrome), instructions on iPhone. */
const InstallHint: React.FC<{ compact?: boolean; dismissible?: boolean }> = ({ compact, dismissible }) => {
  const { t } = useSettings();
  const { way, install } = useInstall();
  const [hidden, setHidden] = useState(() => {
    if (!dismissible) return false;
    try { return localStorage.getItem(DISMISSED) === '1'; } catch { return false; }
  });
  if (hidden || way === 'installed' || way === 'none') return null;
  const dismiss = () => { setHidden(true); try { localStorage.setItem(DISMISSED, '1'); } catch { /* private mode */ } };

  return (
    <div className={compact ? 'text-[11px]' : 'flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-[11px] text-emerald-900'}>
      {!compact && <Smartphone size={14} className="mt-0.5 shrink-0" />}
      <div className="min-w-0 flex-1">
        {way === 'prompt' ? (
          <button onClick={install} className="font-semibold text-emerald-700 hover:underline">{t('Install the app on this device')}</button>
        ) : (
          <span>
            {t('Install it on your iPhone: tap')} <Share size={11} className="inline -translate-y-px" aria-label={t('Share')} /> {t('then “Add to Home Screen”.')}
          </span>
        )}
        {!compact && <span className="block text-emerald-800/80">{t('Full screen, its own icon, opens without a connection. Free, no app store.')}</span>}
      </div>
      {dismissible && (
        <button onClick={dismiss} aria-label={t('Close')} className="rounded p-0.5 hover:bg-emerald-100"><X size={12} /></button>
      )}
    </div>
  );
};

export default InstallHint;
