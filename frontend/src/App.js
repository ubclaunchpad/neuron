import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import { isAuthenticated } from "./api/authService";
import VolunteerDash from "./pages/volunteerDash";
import VolunteerSignup from "./pages/VolunteerSignup";
import VolunteerLogin from "./pages/VolunteerLogin";
import VolunteerForgotPassword from "./pages/VolunteerForgotPassword";
import VolunteerResetPassword from "./pages/VolunteerResetPassword";
import Classes from "./pages/classes";
import VolunteerSchedule from "./pages/schedule";
import VolunteerProfile from "./pages/volunteerProfile";
import AdminVerify from "./pages/AdminVerify";
import "notyf/notyf.min.css";

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
          <Route path="/auth/signup" element={<VolunteerSignup />} />
          <Route path="/auth/login" element={<VolunteerLogin />} />
          <Route path="/auth/forgot-password" element={<VolunteerForgotPassword />}/>
          <Route path="/auth/reset-password" element={<VolunteerResetPassword />}/>
          <Route path="/" element={isVolunteer ? <VolunteerDash /> : <VolunteerLogin />} />
          <Route path="/volunteer/classes" element={isVolunteer ? <Classes /> : <VolunteerLogin />} />
          <Route path="/volunteer/my-profile" element={isVolunteer ? <VolunteerProfile /> : <VolunteerLogin />}/>
          <Route path="/volunteer/schedule" element={isVolunteer ? <VolunteerSchedule /> : <VolunteerLogin />} />
          <Route path="/admin/verify-volunteers" element={<AdminVerify />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;