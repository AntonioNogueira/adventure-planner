// Installing the web app on a phone (Android: the browser's install prompt; iPhone: Share → Add to Home Screen).
import { useEffect, useState } from 'react';

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach(l => l());

/** Offline support and installability; only in the built app (the dev server changes files all the time). */
export function registerServiceWorker() {
  if (typeof window === 'undefined') return;
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e as InstallPromptEvent; notify(); });
  window.addEventListener('appinstalled', () => { deferred = null; notify(); });
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => {}); });
}

/** Running as an installed app (home-screen icon), not in a browser tab. */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(display-mode: standalone)').matches || (navigator as any).standalone === true;
}

/** iPhone/iPad Safari: no install prompt, the user adds it from the Share menu. */
export function isIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export type InstallWay = 'installed' | 'prompt' | 'ios' | 'none';

/** How this device can install the app right now. */
export function useInstall(): { way: InstallWay; install: () => Promise<void> } {
  const [, setTick] = useState(0);
  useEffect(() => { const l = () => setTick(n => n + 1); listeners.add(l); return () => { listeners.delete(l); }; }, []);
  const way: InstallWay = isStandalone() ? 'installed' : deferred ? 'prompt' : isIos() ? 'ios' : 'none';
  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice.catch(() => null);
    deferred = null;
    notify();
  };
  return { way, install };
}
