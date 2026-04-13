import React from "react";
import InfoHint from "../components/InfoHint";

function Users({
  users,
  loading,
  currentUser,
  canManageRoles,
  onPromote,
  onDemote,
  onDeleteUser,
  onTransferSuperAdmin,
}) {
  const currentUserId = currentUser?.id;

  function renderActions(user) {
    if (!canManageRoles) return <span className="muted">View only</span>;
    if (user.role === "super_admin") return <span className="muted">Protected</span>;

    const isSelf = user.id === currentUserId;
    const actions = [];
    if (user.role === "user") {
      actions.push(
        <button key="promote" type="button" className="ghost-button" onClick={() => onPromote(user)}>
          Promote
        </button>,
      );
    } else if (user.role === "admin") {
      actions.push(
        <button key="demote" type="button" className="ghost-button" onClick={() => onDemote(user)}>
          Demote
        </button>,
      );
      actions.push(
        <button key="transfer" type="button" className="ghost-button" onClick={() => onTransferSuperAdmin(user)}>
          Make Super Admin
        </button>,
      );
    }

    if (!isSelf) {
      actions.push(
        <button key="delete" type="button" className="danger-button" onClick={() => onDeleteUser(user)}>
          Delete
        </button>,
      );
    }

    if (actions.length === 0) return <span className="muted">No actions</span>;
    return <div className="row-actions users-actions">{actions}</div>;
  }

  return (
    <section className="page-stack">
      <article className="glass-card panel">
        <h3 className="title-with-help">
          Users Management
          <InfoHint text="View platform users. Only Super Admin can promote, demote, delete, or transfer ownership." />
        </h3>
        <div className="table-wrap glass-card">
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan="4" className="table-empty">
                    Loading users...
                  </td>
                </tr>
              )}
              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan="4" className="table-empty">
                    No users found.
                  </td>
                </tr>
              )}
              {!loading &&
                users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.username || "-"}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`role-badge role-${user.role || "user"}`}>
                        {String(user.role || "user")
                          .replace("_", " ")
                          .replace(/\b\w/g, (ch) => ch.toUpperCase())}
                      </span>
                    </td>
                    <td>{renderActions(user)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}

export default Users;
