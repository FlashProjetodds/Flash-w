import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { User } from '../types';
import {
  getCurrentUser,
  setCurrentUser,
  loadUsers,
  saveUsers,
  generateUniqueUserId,
  clearAllUserSessionData,
} from '../services/storage';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => { success: boolean; error?: string };
  register: (
    name: string,
    email: string,
    password: string,
    confirmPassword: string
  ) => { success: boolean; error?: string };
  logout: () => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(() => getCurrentUser());

  useEffect(() => {
    // Sync active session if changed
    const fresh = getCurrentUser();
    setUserState(fresh);
  }, []);

  const refreshUser = useCallback(() => {
    const fresh = getCurrentUser();
    setUserState(prev => {
      if (!prev && !fresh) return null;
      if (
        prev &&
        fresh &&
        prev.id === fresh.id &&
        prev.balance === fresh.balance &&
        prev.role === fresh.role &&
        prev.email === fresh.email
      ) {
        return prev;
      }
      return fresh;
    });
  }, []);

  const login = useCallback((email: string, password: string): { success: boolean; error?: string } => {
    const trimmedEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!trimmedEmail) {
      return { success: false, error: 'Veuillez renseigner votre adresse email.' };
    }
    if (!cleanPassword) {
      return { success: false, error: 'Veuillez saisir votre mot de passe.' };
    }

    const allUsers = loadUsers();
    const foundUser = allUsers.find(
      u => u.email.toLowerCase() === trimmedEmail || u.id.toUpperCase() === trimmedEmail.toUpperCase()
    );

    if (!foundUser) {
      return {
        success: false,
        error: 'Aucun compte associé à ces identifiants. Veuillez vérifier votre saisie ou créer un compte.',
      };
    }

    if (foundUser.password !== cleanPassword) {
      return {
        success: false,
        error: 'Mot de passe incorrect. Veuillez réessayer.',
      };
    }

    setCurrentUser(foundUser);
    setUserState(foundUser);
    return { success: true };
  }, []);

  const register = useCallback((
    name: string,
    email: string,
    password: string,
    confirmPassword: string
  ): { success: boolean; error?: string } => {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || cleanName.length < 2) {
      return { success: false, error: 'Veuillez saisir votre nom complet (au moins 2 caractères).' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      return { success: false, error: 'Veuillez saisir une adresse email valide.' };
    }

    if (!password || password.length < 6) {
      return { success: false, error: 'Le mot de passe doit comporter au moins 6 caractères.' };
    }

    if (password !== confirmPassword) {
      return { success: false, error: 'La confirmation du mot de passe ne correspond pas.' };
    }

    const allUsers = loadUsers();
    if (allUsers.some(u => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: 'Un compte existe déjà avec cette adresse email. Veuillez vous connecter.' };
    }

    const newUserId = generateUniqueUserId();
    const newUser: User = {
      id: newUserId,
      name: cleanName,
      email: cleanEmail,
      password,
      role: 'user',
      balance: 0.0,
      createdAt: new Date().toISOString(),
    };

    allUsers.push(newUser);
    saveUsers(allUsers);
    setCurrentUser(newUser);
    setUserState(newUser);

    return { success: true };
  }, []);

  const logout = useCallback(() => {
    clearAllUserSessionData();
    setCurrentUser(null);
    setUserState(null);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('flash:logout'));
    }
  }, []);

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';

  const contextValue = useMemo(
    () => ({
      user,
      isAuthenticated,
      isAdmin,
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, isAuthenticated, isAdmin, login, register, logout, refreshUser]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
