// src/App.js
import "notyf/notyf.min.css";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import VolunteerLayout from "./components/volunteerLayout";
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
import ClassPreferences from "./pages/ClassPreferences";

function App() {
  const { isAuthenticated } = useAuth();

  const RouteGuard = ({ fallback, valid }) => {
    return valid ? <Outlet /> : <Navigate to={fallback} replace />;
  };

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
            <Route element={<VolunteerLayout />}>
              <Route index element={<VolunteerDash />} />
              <Route path="volunteer">
                <Route path="classes" element={<Classes />} />
                <Route path="schedule" element={<VolunteerSchedule />} />
                <Route path="my-profile" element={<VolunteerProfile />} />
                <Route path="class-preferences" element={<ClassPreferences />} />
            </Route>
            </Route>

            <Route element={<RouteGuard fallback="/auth/login" valid={isAuthenticated} />}>
              <Route path="/admin/verify-volunteers" element={<AdminVerify />} />
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
