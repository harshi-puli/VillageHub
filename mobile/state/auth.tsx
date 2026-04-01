import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import { subscribeToAuthState, getResidentProfileByUid, type ResidentProfile } from '@/services/authService';

type AuthState = {
  user: User | null | undefined;
  profile: ResidentProfile | null | undefined;
  loading: boolean;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [profile, setProfile] = useState<ResidentProfile | null | undefined>(undefined);

  const refreshProfile = async () => {
    if (!user) {
      setProfile(null);
      return;
    }
    const { profile: nextProfile } = await getResidentProfileByUid(user.uid);
    setProfile(nextProfile);
  };

  useEffect(() => {
    const unsubscribe = subscribeToAuthState(async (nextUser) => {
      setUser(nextUser);
      if (nextUser) {
        const { profile: p } = await getResidentProfileByUid(nextUser.uid);
        setProfile(p);
      } else {
        setProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      profile,
      loading: user === undefined || profile === undefined,
      refreshProfile,
    }),
    [user, profile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

