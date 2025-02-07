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
          <Route element={<RouteGuard fallback={"/"} valid={!isAuthenticated} />}>
            <Route path="/auth/signup" element={<VolunteerSignup />} />
            <Route path="/auth/login" element={<VolunteerLogin />} />
            <Route path="/auth/forgot-password" element={<VolunteerForgotPassword />} />
            <Route path="/auth/reset-password" element={<VolunteerResetPassword />} />
          </Route>

          {/* Volunteer Routes */}
          <Route
            path="/"
            element={(isAuthenticated) ? <VolunteerLayout /> : <Navigate to="/auth/login" replace />}
          >
            {/* Nested Routes within VolunteerLayout */}
            <Route index element={<VolunteerDash />} />
            <Route path="volunteer">
              <Route path="classes" element={<Classes />} />
              <Route path="schedule" element={<VolunteerSchedule />} />
              <Route path="my-profile" element={<VolunteerProfile />} />
            </Route>
          </Route>

          {/* Admin Route */}
          <Route element={<RouteGuard fallback="/" valid={isAuthenticated} />}>
            <Route path="/admin/verify-volunteers" element={<AdminVerify />} />
          </Route>

          {/* Catch-all Route for Undefined Paths */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
