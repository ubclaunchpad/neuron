import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "notyf/notyf.min.css";
import Classes from "./pages/classes";
import VolunteerProfile from "./pages/volunteerProfile";
import VolunteerDash from "./pages/volunteerDash";
import VolunteerSignup from "./pages/VolunteerSignup";
import VolunteerLogin from "./pages/VolunteerLogin";
import VolunteerForgotPassword from "./pages/VolunteerForgotPassword";
import VolunteerResetPassword from "./pages/VolunteerResetPassword";

function App() {
    return (
        <div className="App">
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<VolunteerDash />} />
                    <Route path="/auth/signup" element={<VolunteerSignup />} />
                    <Route path="/auth/login" element={<VolunteerLogin />} />
                    <Route path="/auth/forgot-password"element={<VolunteerForgotPassword />}/>
                    <Route path="/auth/reset-password" element={<VolunteerResetPassword />} />
                    <Route path="/volunteer/classes" element={<Classes />} />
                    <Route path="/volunteer/my-profile" element={<VolunteerProfile />}/>
                    <Route path="/volunteer/schedule" element={<VolunteerDash />}/>
                    <Route path="/volunteer/classes" element={<Classes />} />
                    <Route path="/volunteer/my-profile" element={<VolunteerProfile />}/>
                </Routes>
            </BrowserRouter>
        </div>
    );
}

export default App;
