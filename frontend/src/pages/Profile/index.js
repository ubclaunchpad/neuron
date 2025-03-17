import React from "react";
import { useAuth } from "../../contexts/authContext";
import AdminProfile from "../AdminProfile";
import VolunteerProfile from "../VolunteerProfile";

function Profile() {
    const { isAdmin } = useAuth();
    return isAdmin ? <AdminProfile /> : <VolunteerProfile />;
}

export default Profile;
