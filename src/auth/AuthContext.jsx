import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authApi from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    authApi
      .getMe()
      .then((data) => setUser(data.user?.role === 'admin' ? data.user : null))
      .catch(() => setUser(null))
      .finally(() => setReady(true));
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await authApi.login(email, password);
    if (data.user?.role !== 'admin') {
      // Compte valide mais pas administrateur : on referme la session ouverte
      await authApi.logout().catch(() => {});
      throw new Error(
        'Ce compte n’est pas administrateur. La console est réservée à l’équipe Fluxio.'
      );
    }
    if (data.user.email_verified === false || data.user.status === false) {
      await authApi.logout().catch(() => {});
      // Admin créé mais pas encore activé : il doit saisir le code reçu par email.
      // Sinon le compte a été suspendu, et seul un autre admin peut le réactiver.
      const unverified = data.user.email_verified === false;
      const error = new Error(
        unverified
          ? 'Saisissez le code d’activation reçu par email.'
          : 'Ce compte administrateur est suspendu.'
      );
      if (unverified) error.code = 'UNVERIFIED';
      throw error;
    }
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout().catch(() => {});
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, ready, login, logout }), [user, ready, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
