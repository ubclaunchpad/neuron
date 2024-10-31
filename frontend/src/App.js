import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
<<<<<<< HEAD
import "notyf/notyf.min.css";
import Home from "./pages/home/index";
import Classes from "./pages/classes";
import VolunteerProfile from "./pages/volunteerProfile";
import SignUpPage from "./pages/signup";
import LoginPage from "./pages/login";
import ForgotPasswordPage from "./pages/forgotPassword";
import ResetPasswordPage from "./pages/resetPassword";

function App() {
    return (
        <div className="App">
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/auth/signup" element={<SignUpPage />} />
                    <Route path="/auth/login" element={<LoginPage />} />
                    <Route
                        path="/auth/forgot-password"
                        element={<ForgotPasswordPage />}
                    />
                    <Route
                        path="/auth/reset-password"
                        element={<ResetPasswordPage />}
                    />
                    <Route path="/volunteer/classes" element={<Classes />} />
                    <Route
                        path="/volunteer/my-profile"
                        element={<VolunteerProfile />}
                    />
                    <Route path="/volunteer/hours" element={<Home />} />
                </Routes>
            </BrowserRouter>
        </div>
    );
=======
import Classes from './pages/classes';
import VolunteerProfile from './pages/volunteerProfile';
import VolunteerDash from './pages/volunteerDash';

function App() {

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<VolunteerDash/>} />
          <Route path="/volunteer/classes" element={<Classes/>} />
          <Route path="/volunteer/my-profile" element={<VolunteerProfile/>} />
          <Route path="/volunteer/schedule" element={<VolunteerDash/>} />
        </Routes>
      </BrowserRouter>
    </div>
  );
>>>>>>> origin/main
}

export default App;
