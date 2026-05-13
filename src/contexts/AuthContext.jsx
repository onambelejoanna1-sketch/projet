import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { onAuth, getUser } from '@/services/auth';

const AuthContext = createContext({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  refreshProfile: async () => null,
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Le user fourni par onAuth contient déjà toutes les infos du profil (role inclus).
    // On les synchronise atomiquement dans un seul render pour éviter toute race avec
    // les ProtectedRoute basés sur `isAdmin`.
    const unsub = onAuth((fbUser) => {
      setUser(fbUser);
      setProfile(fbUser);
      setLoading(false);
    });
    return unsub;
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user?.uid) return null;
    try {
      const fresh = await getUser(user.uid);
      setProfile(fresh);
      return fresh;
    } catch {
      return null;
    }
  }, [user?.uid]);

  const value = {
    user,
    profile,
    loading,
    isAdmin: profile?.role === 'admin',
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  return useContext(AuthContext);
}
