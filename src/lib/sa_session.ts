const KEY = 'sa_access_token';

export const saSession = {
  getToken: (): string | null => localStorage.getItem(KEY),
  setToken: (token: string): void => localStorage.setItem(KEY, token),
  clearToken: (): void => localStorage.removeItem(KEY),
  hasToken: (): boolean => Boolean(localStorage.getItem(KEY)),
};
