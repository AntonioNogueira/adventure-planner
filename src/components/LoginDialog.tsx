import React, { useState } from 'react';
import { X, Mail, Loader2 } from 'lucide-react';
import {
  GoogleAuthProvider, FacebookAuthProvider, OAuthProvider, AuthProvider as FirebaseProvider,
  signInWithPopup, signInWithRedirect, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  sendPasswordResetEmail, updateProfile,
} from 'firebase/auth';
import { auth } from '../firebase';
import { AUTH_PROVIDERS, AuthProvider } from '../lib/provider';
import { authErrorMessage, shouldRetryWithRedirect } from '../lib/authErrors';
import { cn } from '../lib/utils';

interface LoginDialogProps {
  onClose: () => void;
  onSignedIn: () => void;
}

const SOCIAL: { id: Exclude<AuthProvider, 'email'>; label: string; make: () => FirebaseProvider; style: string; icon: React.ReactNode }[] = [
  {
    id: 'google', label: 'Continue with Google', make: () => new GoogleAuthProvider(),
    style: 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50',
    icon: (
      <svg viewBox="0 0 48 48" className="h-4 w-4" aria-hidden="true">
        <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.1C12.4 13.7 17.7 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17.1z" />
        <path fill="#FBBC05" d="M10.6 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.9-6.1z" />
        <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.8 2.3-8.5 2.3-6.3 0-11.6-4.2-13.4-10l-7.9 6.1C6.6 42.6 14.6 48 24 48z" />
      </svg>
    ),
  },
  {
    id: 'facebook', label: 'Continue with Facebook', make: () => new FacebookAuthProvider(),
    style: 'border-[#1877F2] bg-[#1877F2] text-white hover:bg-[#166fe0]',
    icon: <span className="flex h-4 w-4 items-center justify-center rounded-sm bg-white text-[11px] font-black text-[#1877F2]">f</span>,
  },
  {
    id: 'apple', label: 'Continue with Apple', make: () => new OAuthProvider('apple.com'),
    style: 'border-black bg-black text-white hover:bg-slate-800',
    icon: <span className="text-base leading-none"></span>,
  },
];

type Mode = 'signin' | 'signup' | 'reset';

/** "Log in": social providers and email (log in, create account, reset password). */
const LoginDialog: React.FC<LoginDialogProps> = ({ onClose, onSignedIn }) => {
  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const run = async (key: string, action: () => Promise<void>) => {
    setBusy(key); setError(null); setNotice(null);
    try { await action(); } catch (err) { setError(authErrorMessage(err)); } finally { setBusy(null); }
  };

  const social = (make: () => FirebaseProvider, id: string) => run(id, async () => {
    try {
      await signInWithPopup(auth, make());
      onSignedIn();
    } catch (err) {
      // Some browsers block pop-ups: fall back to a full-page redirect (completed when the app reloads).
      if (shouldRetryWithRedirect(err)) await signInWithRedirect(auth, make());
      else throw err;
    }
  });

  const submitEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'reset') {
      run('email', async () => {
        await sendPasswordResetEmail(auth, email);
        setNotice(`If there's an account for ${email}, a link to reset the password is on its way.`);
        setMode('signin');
      });
      return;
    }
    run('email', async () => {
      if (mode === 'signup') {
        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        if (name.trim()) await updateProfile(user, { displayName: name.trim() });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onSignedIn();
    });
  };

  const socials = SOCIAL.filter(s => AUTH_PROVIDERS.includes(s.id));
  const emailEnabled = AUTH_PROVIDERS.includes('email');
  const title = mode === 'signup' ? 'Create your account' : mode === 'reset' ? 'Reset your password' : 'Log in';

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} onClick={e => e.stopPropagation()}
        className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow-2xl animate-in zoom-in-95">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-emerald-950">{title}</h2>
            <p className="text-xs text-muted-foreground">Save your expeditions, bookings and share links.</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1.5 hover:bg-slate-100"><X size={18} /></button>
        </div>

        {mode !== 'reset' && socials.length > 0 && (
          <div className="space-y-2">
            {socials.map(s => (
              <button key={s.id} onClick={() => social(s.make, s.id)} disabled={busy !== null}
                className={cn('flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60', s.style)}>
                {busy === s.id ? <Loader2 size={16} className="animate-spin" /> : s.icon}
                {s.label}
              </button>
            ))}
          </div>
        )}

        {emailEnabled && mode !== 'reset' && socials.length > 0 && (
          <div className="flex items-center gap-3 text-[11px] uppercase tracking-wide text-muted-foreground">
            <span className="h-px flex-1 bg-slate-200" />or with email<span className="h-px flex-1 bg-slate-200" />
          </div>
        )}

        {emailEnabled && (
          <form onSubmit={submitEmail} className="space-y-2">
            {mode === 'signup' && (
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" autoComplete="name"
                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
            )}
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" autoComplete="email"
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
            {mode !== 'reset' && (
              <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? 'Password (at least 6 characters)' : 'Password'}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
            )}
            <button type="submit" disabled={busy !== null}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60">
              {busy === 'email' ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
              {mode === 'signup' ? 'Create account' : mode === 'reset' ? 'Send reset link' : 'Log in with email'}
            </button>
          </form>
        )}

        {error && <p role="alert" className="rounded-md bg-red-50 p-2 text-xs text-red-700">{error}</p>}
        {notice && <p className="rounded-md bg-emerald-50 p-2 text-xs text-emerald-800">{notice}</p>}

        {emailEnabled && (
          <div className="flex flex-wrap justify-between gap-2 text-xs">
            {mode === 'signin' ? (
              <>
                <button onClick={() => setMode('signup')} className="font-semibold text-emerald-700 hover:underline">Create an account</button>
                <button onClick={() => setMode('reset')} className="text-muted-foreground hover:underline">Forgot password?</button>
              </>
            ) : (
              <button onClick={() => setMode('signin')} className="font-semibold text-emerald-700 hover:underline">← Back to log in</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginDialog;
