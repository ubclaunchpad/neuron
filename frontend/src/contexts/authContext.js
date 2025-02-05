import React, { createContext, useContext, useEffect, useState } from "react";
import { isAuthenticated } from "../api/authService";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [isVolunteer, setIsVolunteer] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authResponse = await isAuthenticated();

        // Check if the user is a volunteer and update state accordingly
        switch (authResponse.user.role) {
            case "VOLUN":
                setIsVolunteer(true)
                break;
            case "ADMIN":
                setIsAdmin(true)
                break;
        }

        // Optionally, store the general user data
        setUser(authResponse.user);
      } catch (error) {
        console.error("Authentication as volunteer failed:", error);
        setUser(null);
      }
    };

    checkAuth();
  }, []);

  // Function to update the user info globally.
  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    console.log(user)
  }

  return (
    <AuthContext.Provider value={{ isVolunteer, isAdmin, user, updateUser }}>
        {children}
    </AuthContext.Provider>
  );
};
