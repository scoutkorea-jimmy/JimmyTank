"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";

interface AuthState {
  isLoggedIn: boolean;
  username: string;
  mustChangePassword: boolean;
}

interface AuthContextType {
  auth: AuthState;
  login: (username: string, password: string) => string | null;
  logout: () => void;
  changePassword: (newPassword: string) => string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AUTH_KEY = "jimmytank-auth";
const USERS_KEY = "jimmytank-users";

interface UserRecord {
  username: string;
  password: string;
  mustChangePassword: boolean;
}

function getUsers(): UserRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(USERS_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  // Default admin account
  const defaults: UserRecord[] = [
    { username: "admin", password: "admin", mustChangePassword: true },
  ];
  localStorage.setItem(USERS_KEY, JSON.stringify(defaults));
  return defaults;
}

function saveUsers(users: UserRecord[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({
    isLoggedIn: false,
    username: "",
    mustChangePassword: false,
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Verify the session is still valid
        const users = getUsers();
        const user = users.find((u) => u.username === parsed.username);
        if (user) {
          setAuth({
            isLoggedIn: true,
            username: user.username,
            mustChangePassword: user.mustChangePassword,
          });
        }
      }
    } catch {}
  }, []);

  const login = useCallback((username: string, password: string): string | null => {
    const users = getUsers();
    const user = users.find(
      (u) => u.username === username && u.password === password
    );
    if (!user) return "아이디 또는 비밀번호가 틀렸습니다.";

    const state: AuthState = {
      isLoggedIn: true,
      username: user.username,
      mustChangePassword: user.mustChangePassword,
    };
    setAuth(state);
    localStorage.setItem(AUTH_KEY, JSON.stringify({ username: user.username }));
    return null;
  }, []);

  const logout = useCallback(() => {
    setAuth({ isLoggedIn: false, username: "", mustChangePassword: false });
    localStorage.removeItem(AUTH_KEY);
  }, []);

  const changePassword = useCallback(
    (newPassword: string): string | null => {
      if (newPassword.length < 4) return "비밀번호는 최소 4자 이상이어야 합니다.";

      const users = getUsers();
      const idx = users.findIndex((u) => u.username === auth.username);
      if (idx === -1) return "사용자를 찾을 수 없습니다.";

      users[idx].password = newPassword;
      users[idx].mustChangePassword = false;
      saveUsers(users);

      setAuth((prev) => ({ ...prev, mustChangePassword: false }));
      return null;
    },
    [auth.username]
  );

  return (
    <AuthContext.Provider value={{ auth, login, logout, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
