import React, { createContext, useContext, useEffect, useState } from "react";
import { apiRequest, ApiUser, getAccessToken, setAccessToken } from "@/lib/api";

interface AuthState {
  user: Pick<ApiUser, "id" | "email"> | null;
  role: ApiUser["role"] | null;
  profile: ApiUser | null;
  loading: boolean;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<ApiUser["role"]>;
  signOut: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    role: null,
    profile: null,
    loading: true,
  });

  useEffect(() => {
    if (!getAccessToken()) {
      setState((current) => ({ ...current, loading: false }));
      return;
    }
    apiRequest<ApiUser>("/auth/me")
      .then(setProfileState)
      .catch((error: unknown) => {
        console.error("Unable to restore the signed-in user:", error);
        setAccessToken(null);
        setState({ user: null, role: null, profile: null, loading: false });
      });
  }, []);

  const setProfileState = (profile: ApiUser) => {
    setState({
      user: { id: profile.id, email: profile.email },
      role: profile.role,
      profile,
      loading: false,
    });
  };

  const signIn = async (email: string, password: string) => {
    const result = await apiRequest<{ access_token: string; user: ApiUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setAccessToken(result.access_token);
    setProfileState(result.user);
    return result.user.role;
  };

  const signOut = () => {
    setAccessToken(null);
    setState({ user: null, role: null, profile: null, loading: false });
  };

  const refreshProfile = async () => {
    if (state.user) setProfileState(await apiRequest<ApiUser>("/auth/me"));
  };

  return (
    <AuthContext.Provider value={{ ...state, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
