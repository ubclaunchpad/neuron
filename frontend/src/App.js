// src/App.js
import "notyf/notyf.min.css";
import { useEffect } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import api from "./api/api";
import SidebarLayout from "./components/SidebarLayout";
import { useAuth } from "./contexts/authContext";
import AdminVerify from "./pages/AdminVerify";
import Classes from "./pages/Classes";
import VolunteerSchedule from "./pages/Schedule";
import VolunteerDash from "./pages/VolunteerDash";
import VolunteerForgotPassword from "./pages/VolunteerForgotPassword";
import VolunteerLogin from "./pages/VolunteerLogin";
import VolunteerProfile from "./pages/VolunteerProfile";
import VolunteerResetPassword from "./pages/VolunteerResetPassword";
import VolunteerSignup from "./pages/VolunteerSignup";
import MemberManagement from "./pages/MemberManagement";
import AdminVolunteerProfile from "./pages/AdminVolunterProfile";

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
            <Route path="signup" element={<VolunteerSignup />} />
            <Route path="login" element={<VolunteerLogin />} />
            <Route path="forgot-password" element={<VolunteerForgotPassword />} />
            <Route path="reset-password" element={<VolunteerResetPassword />} />
          </Route>

          {/* Auth Protected Routes */}
          <Route element={<RouteGuard fallback="/auth/login" valid={isAuthenticated} />}>

            {/* Nested Routes within VolunteerLayout */}
            <Route element={<SidebarLayout />}>
              <Route index element={<VolunteerDash />} />
              <Route path="classes" element={<Classes />} />
              <Route path="schedule" element={<VolunteerSchedule />} />

              <Route element={<RouteGuard fallback="/" valid={isVolunteer} />}>
                <Route path="my-profile" element={<VolunteerProfile />} />
              </Route>

              <Route element={<RouteGuard fallback="/" valid={isAdmin} />}>
                <Route path="verify-volunteers" element={<AdminVerify />} />
                <Route path="member-management" element={<MemberManagement />} />
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
