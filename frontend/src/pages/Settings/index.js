import React, { useState } from "react";
import "./index.css";
import { FaBell } from "react-icons/fa";
import ChangePasswordCard from "../../components/volunteerProfile/changePasswordCard";
import Permission from "../../components/utils/Permission";

function Settings() {
  const [notifications, setNotifications] = useState({
    classReminders: true,
    coverageRequests: true,
    volunteerShiftReminders: true, // New volunteer-specific option
    setting3: false,
    setting4: false,
    setting5: false,
    setting6: false,
  });

  const toggleNotification = (key) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <main className="settings-container">
      <div className="settings-header">
        <h2 className="settings-title">Settings</h2>

        {/* Admin-only notification button */}
        <div className="top-right-button-container">
          <Permission permissions={["admin"]}>
            <button className="top-right-button">
              <div className="bell-container">
                <FaBell className="bell-icon" />
                <span className="notification-badge"></span>
              </div>
              Notifications
            </button>
          </Permission>
        </div>
      </div>

      {/* Notifications Card */}
      <div className="notification-container">
        <h3>Notifications</h3>
        <div className="notification-list">
          {/* Admin notifications */}
          <Permission permissions={["admin"]}>
            <label className="notification-item">
              <span className="notification-text">Email me reminders for upcoming classes</span>
              <div className={`toggle-container ${notifications.classReminders ? 'checked' : ''}`}>
                <input
                  type="checkbox"
                  checked={notifications.classReminders}
                  onChange={() => toggleNotification("classReminders")}
                />
                <span className="slider"></span>
              </div>
            </label>

            <label className="notification-item">
              <span className="notification-text">Email me new coverage requests</span>
              <div className={`toggle-container ${notifications.coverageRequests ? 'checked' : ''}`}>
                <input
                  type="checkbox"
                  checked={notifications.coverageRequests}
                  onChange={() => toggleNotification("coverageRequests")}
                />
                <span className="slider"></span>
              </div>
            </label>
          </Permission>

          {/* Volunteer notification */}
          <Permission permissions={["volunteer"]}>
            <label className="notification-item">
              <span className="notification-text">Email me reminders for upcoming shift</span>
              <div className={`toggle-container ${notifications.volunteerShiftReminders ? 'checked' : ''}`}>
                <input
                  type="checkbox"
                  checked={notifications.volunteerShiftReminders}
                  onChange={() => toggleNotification("volunteerShiftReminders")}
                />
                <span className="slider"></span>
              </div>
            </label>
          </Permission>

          {/* Generic notification options (unchanged) */}
          {/* {["setting3", "setting4", "setting5", "setting6"].map((setting, index) => (
            <label key={index} className="notification-item">
              <span className="notification-text">Description</span>
              <div className={`toggle-container ${notifications[setting] ? 'checked' : ''}`}>
                <input
                  type="checkbox"
                  checked={notifications[setting]}
                  onChange={() => toggleNotification(setting)}
                />
                <span className="slider"></span>
              </div>
            </label>
          ))} */}
        </div>
      </div>

      {/* Change Password Card */}
      <ChangePasswordCard />
    </main>
  );
}

export default Settings;