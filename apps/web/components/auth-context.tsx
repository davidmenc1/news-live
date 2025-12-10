"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import type { User, RegisterPayload, LoginPayload } from "@/lib/types";
import { register, login, logout, getToken, getCurrentUser } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  register: (payload: RegisterPayload) => Promise<void>;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in by validating token
    const restoreSession = async () => {
      try {
        const token = getToken();
        if (token) {
          // Try to fetch current user to validate session
          const response = await getCurrentUser();
          setUser(response.user);
        }
      } catch (error) {
        // Session is invalid or expired
        console.debug("Session not found or expired");
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const handleRegister = async (payload: RegisterPayload) => {
    const response = await register(payload);
    setUser(response.user);
  };

  const handleLogin = async (payload: LoginPayload) => {
    const response = await login(payload);
    setUser(response.user);
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        register: handleRegister,
        login: handleLogin,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
