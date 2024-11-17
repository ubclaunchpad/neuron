import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import { isAuthenticated } from "./api/authService";
import VolunteerDash from "./pages/volunteerDash";
import VolunteerSignup from "./pages/VolunteerSignup";
import VolunteerLogin from "./pages/VolunteerLogin";
import VolunteerForgotPassword from "./pages/VolunteerForgotPassword";
import VolunteerResetPassword from "./pages/VolunteerResetPassword";
import Classes from "./pages/classes";
import VolunteerProfile from "./pages/volunteerProfile";
import AdminVerify from "./pages/AdminVerify";

function App() {
    const [isAuth, setIsAuth] = useState(false);
    const [volunteerID, setVolunteerID] = useState(null);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const authResponse = await isAuthenticated();
                if (authResponse && authResponse.volunteer && authResponse.volunteer.volunteer_id) {
                    const volunteerId = authResponse.volunteer.volunteer_id;
                    console.log("Authenticated as volunteer:", volunteerId);
    
                    setIsAuth(true);
                    setVolunteerID(volunteerId);
                    localStorage.setItem("volunteerID", volunteerId); // Store in localStorage
                } else {
                    setIsAuth(false);
                }
            } catch (error) {
                console.error("Authentication as volunteer failed:", error);
                setIsAuth(false);
            }
        };
        checkAuth();
    }, []);

    return (
        <div className="App">
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<VolunteerDash />} />
                    <Route path="/auth/signup" element={<VolunteerSignup />} />
                    <Route path="/auth/login" element={<VolunteerLogin />} />
                    <Route path="/auth/forgot-password" element={<VolunteerForgotPassword />}/>
                    <Route path="/auth/reset-password" element={<VolunteerResetPassword />}/>
                    {isAuth && volunteerID && ( <>
                            <Route path="/volunteer/classes" element={<Classes />} />
                            <Route path="/volunteer/my-profile" element={<VolunteerProfile />} />
                            <Route path="/volunteer/schedule" element={<VolunteerDash />}/>
                            <Route path="/volunteer/classes" element={<Classes />} /> </>
                    )}
                    <Route path="/admin/verify-volunteers" element={<AdminVerify />} />
                </Routes>
            </BrowserRouter>
        </div>
    );
}

export default App;