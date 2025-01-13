// src/App.js
import "notyf/notyf.min.css";
import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { isAuthenticated } from "./api/authService";
import VolunteerLayout from "./components/volunteerLayout";
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
  const [isVolunteer, setIsVolunteer] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authResponse = await isAuthenticated();
        if (
          authResponse &&
          authResponse.volunteer &&
          authResponse.volunteer.volunteer_id
        ) {
          setIsVolunteer(true);
          localStorage.setItem("volunteerID", authResponse.volunteer.volunteer_id);
        } else {
          setIsVolunteer(false);
        }
      } catch (error) {
        console.error("Authentication as volunteer failed:", error);
        setIsVolunteer(false);
      }
    };
    checkAuth();
  }, []);

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/auth/signup" element={<VolunteerSignup />} />
          <Route path="/auth/login" element={<VolunteerLogin />} />
          <Route path="/auth/forgot-password" element={<VolunteerForgotPassword />} />
          <Route path="/auth/reset-password" element={<VolunteerResetPassword />} />

          {/* Volunteer Routes */}
          <Route
            path="/"
            element={isVolunteer ? <VolunteerLayout /> : <Navigate to="/auth/login" replace />}
          >
            {/* Nested Routes within VolunteerLayout */}
            <Route index element={<VolunteerDash />} />
            <Route path="volunteer">
              <Route path="classes" element={<Classes />} />
              <Route path="schedule" element={<VolunteerSchedule />} />
              <Route path="my-profile" element={<VolunteerProfile />} />
            </Route>
          </Route>

          {/* Admin Route (Assuming it's accessible without authentication or has its own protection) */}
          <Route path="/admin/verify-volunteers" element={<AdminVerify />} />

          {/* Catch-all Route for Undefined Paths */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
