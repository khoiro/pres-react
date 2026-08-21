import { createContext, useEffect, useState } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    const savedRoles = localStorage.getItem("roles");
    const savedPermissions = localStorage.getItem("permissions");

    if (savedToken) setToken(savedToken);
    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedRoles) setRoles(JSON.parse(savedRoles));
    if (savedPermissions) setPermissions(JSON.parse(savedPermissions));

    setLoading(false);
  }, []);

  const login = (data) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("refresh_token", data.refresh_token);
    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("roles", JSON.stringify(data.roles));
    localStorage.setItem("permissions", JSON.stringify(data.permissions));

    setToken(data.token);
    setUser(data.user);
    setRoles(data.roles);
    setPermissions(data.permissions);
  };

  const logout = () => {
    localStorage.clear();

    setToken(null);
    setUser(null);
    setRoles([]);
    setPermissions({});
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        roles,
        permissions,
        loading,
        login,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
