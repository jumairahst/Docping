import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import api from './api';

export const getAuthConfig = async () => {
  const user = auth.currentUser;

  if (!user) return {};

  const token = await user.getIdToken();

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export function useAuthProfile() {
  const [authUser, setAuthUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (cancelled) return;

      setAuthUser(user);

      if (!user) {
        setProfile(null);
        setAuthLoading(false);
        return;
      }

      try {
        const token = await user.getIdToken();

        const res = await api.get('/users/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!cancelled) {
          setProfile(res.data?.user || null);
        }
      } catch (err) {
        if (!cancelled) {
          setProfile(null);
        }
      } finally {
        if (!cancelled) {
          setAuthLoading(false);
        }
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const displayName =
    profile?.name ||
    authUser?.displayName ||
    authUser?.email ||
    '';

  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('') || 'U';

  const role = profile?.role || null;

  return {
    authUser,
    profile,
    displayName,
    initials,
    role,
    authLoading,
  };
}