import { describe, expect, it } from 'vitest';
import { authErrorMessage, shouldRetryWithRedirect } from '../authErrors';

describe('authErrorMessage', () => {
  it('explains how to fix an unauthorised domain', () => {
    expect(authErrorMessage({ code: 'auth/unauthorized-domain' })).toContain('Authorized domains');
  });
  it('explains disabled providers and wrong credentials', () => {
    expect(authErrorMessage({ code: 'auth/operation-not-allowed' })).toContain('Sign-in method');
    expect(authErrorMessage({ code: 'auth/invalid-credential' })).toBe('Email or password is incorrect.');
    expect(authErrorMessage({ code: 'auth/email-already-in-use' })).toContain('already an account');
  });
  it('falls back to a generic message with the code', () => {
    expect(authErrorMessage({ code: 'auth/something-new' })).toBe('Sign-in failed (something-new). Please try again.');
    expect(authErrorMessage(new Error('x'))).toBe('Sign-in failed. Please try again.');
  });
});

describe('shouldRetryWithRedirect', () => {
  it('retries blocked popups with a redirect', () => {
    expect(shouldRetryWithRedirect({ code: 'auth/popup-blocked' })).toBe(true);
    expect(shouldRetryWithRedirect({ code: 'auth/popup-closed-by-user' })).toBe(false);
  });
});
