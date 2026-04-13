import React from "react";

function Settings({ theme, onThemeToggle, user }) {
  return (
    <section className="page-stack">
      <article className="glass-card panel">
        <h3>Workspace Settings</h3>
        <div className="settings-grid">
          <div>
            <p className="muted">Current Theme</p>
            <button type="button" className="ghost-button" onClick={onThemeToggle}>
              Switch to {theme === "dark" ? "Light" : "Dark"}
            </button>
          </div>
          <div>
            <p className="muted">Role</p>
            <strong>{user?.role || "User"}</strong>
          </div>
          <div>
            <p className="muted">Notification Policy</p>
            <strong>Critical risks + failed uploads</strong>
          </div>
        </div>
      </article>
    </section>
  );
}

export default Settings;
