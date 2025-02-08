import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../api/api";
import { checkAuth } from "../api/authService";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isVolunteer, setIsVolunteer] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(undefined);
  
  // Local state
  const [loading, setLoading] = useState(true);

  // Function to check authentication and update state
  const doCheckAuth = async () => {
    try {
      const authResponse = await checkAuth();

      switch (authResponse.user.role) {
        case "VOLUN":
          setIsVolunteer(true);
          break;
        case "ADMIN":
          setIsAdmin(true);
          break;
        default:
          break;
      }

      setUser(authResponse.user);
      setIsAuthenticated(true);
    } catch (error) {
      setUser(undefined);
      setIsVolunteer(false);
      setIsAdmin(false);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    doCheckAuth();
  }, []);

  const login = async (credentials) => {
    const response = await api.post("/auth/login", credentials)
      .catch(err => {
        setIsAuthenticated(false);
        throw err;
      });
  
    localStorage.setItem("neuronAuthToken", response.data.token);
    setTimeout(() => {
      doCheckAuth();
    }, 1500);
  };

  const logout = () => {
    localStorage.clear("neuronAuthToken");
    setIsAuthenticated(false);
  };

  const updateUser = updatedUser => setUser(updatedUser);

  return (
    <AuthContext.Provider value={{ isVolunteer, isAdmin, user, updateUser, isAuthenticated, login, logout }}>
      {/* Loading state as to not lose url, TODO: make it prettier, use gmail as an example of a full page loader */}
      {loading ? <></> : children}
    </AuthContext.Provider>
  );
};
