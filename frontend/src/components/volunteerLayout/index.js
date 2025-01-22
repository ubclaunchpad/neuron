import { React, useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import BC_brain from "../../assets/bwp-logo-text.png";
import nav_item_classes from "../../assets/nav-item-classes.png";
import nav_item_dash from "../../assets/nav-item-dash.png";
import nav_item_schedule from "../../assets/nav-item-sched.png";
import nav_item_settings from "../../assets/nav-item-settings.png";
import sidebar_toggle from "../../assets/sidebar-toggle.png";
import "./index.css";

import { isAuthenticated } from "../../api/authService";
import { formatImageUrl } from "../../api/imageService";
import NavProfileCard from "../NavProfileCard";

function VolunteerLayout() {
  const [collapsed, setCollapsed] = useState(window.innerWidth <= 800);
  const [volunteer, setVolunteer] = useState(null);
  const [profilePic, setProfilePic] = useState(null);

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
  
  // Fetch user info
  useEffect(() => {
    const fetchVolunteerData = async () => {
      try {
        const authData = await isAuthenticated();
        if (authData.isAuthenticated && authData.volunteer) {
          setVolunteer(authData.volunteer);

          const imageUrl = authData.user.fk_image_id ? formatImageUrl(authData.user.fk_image_id) : undefined;

          setProfilePic(imageUrl);
        } else {
          setVolunteer(null);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setVolunteer(null);
      }
    };
    fetchVolunteerData();
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
            avatar={profilePic}
            name={volunteer?.p_name ?? volunteer?.f_name}
            email={volunteer?.email}
            collapse={collapsed}
            link="/volunteer/my-profile"
          />
        </div>
      </aside>
      <Outlet /> {/* Render page content here */}
    </div>
  );
}

export default VolunteerLayout;
