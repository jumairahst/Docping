import React, { createContext, useContext } from 'react';
import { useAuthProfile } from '../authProfile';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const auth = useAuthProfile();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}