// src/App.js
import "notyf/notyf.min.css";
import { useEffect } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import api from "./api/api";
import SidebarLayout from "./components/SidebarLayout";
import { useAuth } from "./contexts/authContext";
import Classes from "./pages/Classes";
import ClassPreferences from "./pages/ClassPreferences";
import CoverageRequests from "./pages/CoverageRequests";
import Dashboard from "./pages/Dashboard";
import ForgotPassword from "./pages/ForgotPassword";
import Login from "./pages/Login";
import MemberManagement from "./pages/MemberManagement";
import ResetPassword from "./pages/ResetPassword";
import Schedule from "./pages/Schedule";
import Settings from "./pages/Settings";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import AdminVolunteerProfile from "./pages/AdminVolunterProfile";
import VolunteerNotVerified from "./pages/VolunteerNotVerified";
import VolunteerDeactivated from "./pages/VolunteerDeactivated";

function App() {
  const { isAuthenticated, isAdmin, isVolunteer, logout } = useAuth();

  const RouteGuard = ({ fallback, valid }) => {
    return valid ? <Outlet /> : <Navigate to={fallback} replace />;
  };

  // Register logout handler on api error
  useEffect(() => {
    api.interceptors.response.use(
      (response) => response,
      (error) => {
          if (error?.response && error.response.status === 401) {
              logout();
          }
          return Promise.reject(error);
      }
    );
  })

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="auth" element={<RouteGuard fallback={"/"} valid={!isAuthenticated} />}>
            <Route path="signup" element={<Signup />} />
            <Route path="login" element={<Login />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="reset-password" element={<ResetPassword />} />
            <Route path="not-verified" element={<VolunteerNotVerified />} />
            <Route path="deactivated" element={<VolunteerDeactivated />} />
          </Route>

          {/* Auth Protected Routes */}
          <Route element={<RouteGuard fallback="/auth/login" valid={isAuthenticated} />}>
            <Route element={<SidebarLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="classes" element={<Classes />} />
              <Route path="schedule" element={<Schedule/>} />
              <Route path="settings" element={<Settings />} />
              <Route path="profile" element={<Profile />} />

              <Route element={<RouteGuard fallback="/" valid={isVolunteer} />}>
                <Route path="profile/preferences" element={<ClassPreferences />} />
              </Route>

              <Route element={<RouteGuard fallback="/" valid={isAdmin} />}>
                <Route path="management" element={<MemberManagement />} />
                <Route path="requests" element={<CoverageRequests />} />
                <Route path="volunteer-profile" element={<AdminVolunteerProfile />} />
              </Route>
            </Route>
          </Route>

          {/* Catch-all Route for Undefined Paths */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
