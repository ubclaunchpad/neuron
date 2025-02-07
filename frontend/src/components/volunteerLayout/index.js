import { React, useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import BC_brain from "../../assets/bwp-logo-text.png";
import nav_item_classes from "../../assets/nav-item-classes.png";
import nav_item_dash from "../../assets/nav-item-dash.png";
import nav_item_schedule from "../../assets/nav-item-sched.png";
import nav_item_settings from "../../assets/nav-item-settings.png";
import sidebar_toggle from "../../assets/sidebar-toggle.png";
import "./index.css";

import { formatImageUrl } from "../../api/imageService";
import { useAuth } from "../../contexts/authContext";
import NavProfileCard from "../NavProfileCard";

function VolunteerLayout() {
  const [collapsed, setCollapsed] = useState(window.innerWidth <= 800);
  const { user } = useAuth();

  // Toggle function for displaying/hiding sidebar
  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  // Automatically collapse/expand sidebar based on screen width
  useEffect(() => {
    const handleResize = () => {
      setCollapsed(window.innerWidth <= 800);
    };

    // Handle with media query, only overwrite the user's choice when switching over/under 800px
    const mediaQuery = window.matchMedia('(min-width: 800px)')
    mediaQuery.addEventListener('change', handleResize);
    handleResize();

    return () => mediaQuery.removeEventListener('change', handleResize);
  }, []);

  return (
    <div className="main-container">
      <aside className={`navbar ${collapsed ? "collapsed" : ""}`}>
        <span className="logo-banner">
          {!collapsed && (
            <a href="https://www.bcbrainwellness.ca/">
              <img
                src={BC_brain}
                alt="BC Brain Logo"
                style={{ width: "144px", paddingTop: "8px" }}
              />
            </a>
          )}
          <img
            src={sidebar_toggle}
            alt="Navbar Toggle"
            style={{ width: "40px", cursor: "pointer" }}
            onClick={toggleSidebar}
          />
        </span>
        <div className="nav-list">
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive ? "NavbarText nav-item active" : "NavbarText nav-item"
            }
          >
            <img src={nav_item_dash} alt="Dashboard" />
            {!collapsed && "Overview"}
          </NavLink>
          <NavLink
            to="/volunteer/schedule"
            className={({ isActive }) =>
              isActive ? "NavbarText nav-item active" : "NavbarText nav-item"
            }
          >
            <img src={nav_item_schedule} alt="Schedule" />
            {!collapsed && "Schedule"}
          </NavLink>
          <NavLink
            to="/volunteer/classes"
            className={({ isActive }) =>
              isActive ? "NavbarText nav-item active" : "NavbarText nav-item"
            }
          >
            <img src={nav_item_classes} alt="Classes" />
            {!collapsed && "Classes"}
          </NavLink>
          <NavLink
            to="/volunteer/my-profile"
            className={({ isActive }) =>
              isActive ? "NavbarText nav-item active" : "NavbarText nav-item"
            }
          >
            <img src={nav_item_settings} alt="Settings" />
            {!collapsed && "Settings"}
          </NavLink>
        </div>
        <div className="nav-profile-card-container">
          <NavProfileCard
            avatar={formatImageUrl(user?.fk_image_id)}
            name={user?.volunteer?.p_name ?? user?.volunteer?.f_name}
            email={user?.volunteer?.email}
            collapse={collapsed}
            link="/volunteer/my-profile"
          />
        </div>
      </aside>
      <Outlet />
    </div>
  );
}

export default VolunteerLayout;
