import React, { useState } from "react";
import "./index.css";
import { FaBell } from "react-icons/fa";

function Settings() {
  const [notifications, setNotifications] = useState({
    classReminders: true,
    coverageRequests: true,
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
        <button className="top-right-button">
          <div className="bell-container">
            <FaBell className="bell-icon" />
            <span className="notification-badge"></span>
          </div>
          Notifications
        </button>
      </div>
      <div className="settings-card full-width">
        <h3 className="settings-subtitle">Notifications</h3>
        <div className="notification-list">
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
          {["setting3", "setting4", "setting5", "setting6"].map((setting, index) => (
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
          ))}
        </div>
      </div>
    </main>
  );
}

export default Settings;