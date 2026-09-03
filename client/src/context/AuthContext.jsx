import { createContext, useContext, useState, useEffect } from 'react';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = localStorage.getItem('boafo_token');
    const u = localStorage.getItem('boafo_user');
    const r = localStorage.getItem('boafo_role');
    if (t && u) { setUser(JSON.parse(u)); setRole(r); }
    setLoading(false);
  }, []);
  function login(token, userData, userRole) {
    localStorage.setItem('boafo_token', token);
    localStorage.setItem('boafo_user', JSON.stringify(userData));
    localStorage.setItem('boafo_role', userRole);
    setUser(userData); setRole(userRole);
  }
  function logout() {
    localStorage.removeItem('boafo_token'); localStorage.removeItem('boafo_user'); localStorage.removeItem('boafo_role');
    setUser(null); setRole(null);
  }
  return <AuthContext.Provider value={{ user, role, login, logout, loading }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
