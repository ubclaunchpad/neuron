import "./index.css";
import { NavLink } from "react-router-dom";
import BC_brain from "../../assets/bc_brain_logo.png";

// Global Header component that is displayed on all pages.
function Header() {
    return (
        <div>
            <div className="Header">
                <div className="HeaderLogo">
                    <a href="https://www.bcbrainwellness.ca/">
                        <img src={BC_brain} alt="BC Brain Logo" />
                    </a>
                </div>
                <NavLink
                    to="/"
                    className={({ isActive }) =>
                        isActive ? "HeaderTitleActive" : "HeaderTitle"
                    }>
                    Home
                </NavLink>
                <NavLink
                    to="/volunteer/classes"
                    className={({ isActive }) =>
                        isActive ? "HeaderTitleActive" : "HeaderTitle"
                    }>
                    Classes
                </NavLink>
                <NavLink
                    to="/volunteer/my-profile"
                    className={({ isActive }) =>
                        isActive ? "HeaderTitleActive" : "HeaderTitle"
                    }>
                    My Profile
                </NavLink>
                <NavLink
                    to="/volunteer/hours"
                    className={({ isActive }) =>
                        isActive ? "HeaderTitleActive" : "HeaderTitle"
                    }>
                    Hours
                </NavLink>
            </div>
        </div>
    );
}

export default Header;
