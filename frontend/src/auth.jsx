import { createContext, useContext, useEffect, useState } from "react";
import api from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem("token")));

  useEffect(() => {
    if (!loading) {
      return;
    }
    api
      .get("/auth/me")
      .then((res) => setUser(res.data.user))
      .finally(() => setLoading(false));
  }, [loading]);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    localStorage.setItem("token", res.data.token);
    setUser(res.data.user);
  };

  const signupParticipant = async (payload) => {
    const res = await api.post("/auth/participant-signup", payload);
    localStorage.setItem("token", res.data.token);
    setUser(res.data.user);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, signupParticipant, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
