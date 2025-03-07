import { useAuth } from "../../../contexts/authContext";
import "./index.css";

const Permission = ({ children, permissions }) => {
    const { isVolunteer, isAdmin } = useAuth();

    if (!Array.isArray(permissions)) {
        permissions = [permissions];
    }

    if (isAdmin && permissions.includes('admin')) {
        return children;
    } 
    else if (isVolunteer && permissions.includes('volunteer')) {
        return children;
    }
    // else if (isInstructor && permissions.includes('instructor')) {
    //     return children;
    // }

    return <></>;
};

export default Permission;
