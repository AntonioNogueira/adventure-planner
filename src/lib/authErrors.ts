import { t } from './settings';
// Firebase Authentication error codes → messages that say what to do.

const host = () => (typeof window !== 'undefined' ? window.location.hostname : 'this site');

export function authErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code || '';
  switch (code) {
    case 'auth/unauthorized-domain':
      return t('This website ({host}) isn\'t authorised for sign-in yet. In Firebase → Authentication → Settings → Authorized domains, add "{host}".', { host: host() });
    case 'auth/operation-not-allowed':
    case 'auth/configuration-not-found':
      return t('This sign-in method isn\'t enabled yet in Firebase → Authentication → Sign-in method.');
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return t('The sign-in window was closed before finishing.');
    case 'auth/popup-blocked':
      return t('The browser blocked the sign-in window. Allow pop-ups for this site, or try again.');
    case 'auth/account-exists-with-different-credential':
      return t('An account already exists with this email using another sign-in method. Log in with that method first.');
    case 'auth/invalid-email':
      return t('That email address doesn\'t look right.');
    case 'auth/missing-password':
      return t('Please enter your password.');
    case 'auth/weak-password':
      return t('Choose a password with at least 6 characters.');
    case 'auth/email-already-in-use':
      return t('There\'s already an account with this email. Log in instead, or reset your password.');
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-login-credentials':
      return t('Email or password is incorrect.');
    case 'auth/too-many-requests':
      return t('Too many attempts. Wait a few minutes, or reset your password.');
    case 'auth/network-request-failed':
      return t('No connection to the sign-in service. Check your internet connection.');
    default:
      return code ? t('Sign-in failed ({code}). Please try again.', { code: code.replace('auth/', '') }) : t('Sign-in failed. Please try again.');
  }
}

/** Errors that mean "the popup didn't work here, try a full-page redirect instead". */
export function shouldRetryWithRedirect(error: unknown) {
  const code = (error as { code?: string })?.code || '';
  return code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment';
}
