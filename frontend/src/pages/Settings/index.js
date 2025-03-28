import React, { useState } from "react";
import Notifications from "../../components/Notifications";
import Permission from "../../components/utils/Permission";
import ChangePasswordCard from "../../components/volunteerProfile/changePasswordCard";
import "./index.css";

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
    <main className="content-container">
      <div className="content-heading">
          <h2 className="content-title">Settings</h2>
          <Notifications />
      </div>

      <div className="settings-container">
        {/* Notifications Card */}
        <div className="notification-container">
          <h2 className="settings-card-title">Notifications</h2>
          <div className="notification-list">
            {/* Admin notifications */}
            <Permission permissions="admin">
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
            <Permission permissions="volunteer">
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
      </div>
    </main>
  );
}

export default Settings;