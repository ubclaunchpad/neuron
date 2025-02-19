import React, { createContext, useContext, useState, useEffect } from 'react';
import { checkAuth } from '../api/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isVolunteer, setIsVolunteer] = useState(false);

  useEffect(() => {
    const authenticate = async () => {
      try {
        const authResponse = await checkAuth();
        setIsAuthenticated(!!authResponse);
        setIsAdmin(authResponse?.user?.role === 'admin');
        setIsVolunteer(!!authResponse?.volunteer?.volunteer_id);
      } catch (error) {
        console.error('Authentication failed:', error);
        setIsAuthenticated(false);
        setIsAdmin(false);
        setIsVolunteer(false);
      }
    };
    authenticate();
  }, []);

  return (
      <AuthContext.Provider value={{ isAuthenticated, isAdmin, isVolunteer }}>
        {children}
      </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);