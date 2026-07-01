/**
 * session.ts — single owner of the auth token.
 *
 * All reads and writes to localStorage go through here.
 * To change the storage key, mechanism, or token shape → edit only this file.
 */

const KEY = 'access_token';

export const session = {
  getToken: (): string | null => localStorage.getItem(KEY),
  setToken: (token: string): void => localStorage.setItem(KEY, token),
  clearToken: (): void => localStorage.removeItem(KEY),
  hasToken: (): boolean => Boolean(localStorage.getItem(KEY)),
};
