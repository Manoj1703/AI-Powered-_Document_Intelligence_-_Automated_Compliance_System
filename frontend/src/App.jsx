import React, { useEffect, useMemo, useState } from "react";
import {
  deleteUserById,
  deleteDocumentById,
  fetchCurrentUser,
  fetchDashboardStats,
  fetchDocumentById,
  fetchDocuments,
  fetchHealth,
  fetchUsers,
  loginUser,
  logoutUser,
  registerUser,
  transferSuperAdmin,
  updateUserRole,
  uploadDocument,
} from "./api";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import DetailModal from "./components/DetailModal";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import Documents from "./pages/Documents";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Activity from "./pages/Activity";
import Users from "./pages/Users";
import Login from "./pages/Login";
import { getNavItems, normalizeDetailPayload } from "./utils";

const SESSION_KEY = "docagent-session";
const THEME_KEY = "docagent-theme";

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || "dark");
  const [session, setSession] = useState(() => {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  });

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentPage, setCurrentPage] = useState("dashboard");

  const [health, setHealth] = useState("Checking...");
  const [stats, setStats] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [uploadHistory, setUploadHistory] = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [selectedDocument, setSelectedDocument] = useState(null);

  const [globalError, setGlobalError] = useState("");

  function addActivity(action, detail) {
    const now = Date.now();
    const item = {
      action,
      detail,
      created_at: now,
      time: new Date(now).toLocaleString(),
    };

    let added = false;
    setActivityLog((prev) => {
      const latest = prev[0];
      if (
        latest &&
        latest.action === action &&
        latest.detail === detail &&
        typeof latest.created_at === "number" &&
        now - latest.created_at < 5000
      ) {
        return prev;
      }
      added = true;
      return [item, ...prev];
    });
    if (added) {
      setUnreadNotifications((prev) => prev + 1);
    }
  }

  async function loadData() {
    if (!session?.user) return;

    setLoading(true);
    setGlobalError("");
    try {
      const [healthData, statsData, docsData] = await Promise.all([
        fetchHealth(),
        fetchDashboardStats(session.token),
        fetchDocuments(session.token),
      ]);
      setHealth(healthData?.status === "ok" ? "Online" : "Unknown");
      setStats(statsData);
      setDocuments(Array.isArray(docsData) ? docsData : []);
      if (session.user?.role === "admin" || session.user?.role === "super_admin") {
        const usersData = await fetchUsers(session.token);
        setUsers(Array.isArray(usersData) ? usersData : []);
      } else {
        setUsers([]);
      }
    } catch (err) {
      setHealth("Offline");
      setGlobalError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    async function bootstrap() {
      try {
        const token = session?.token;
        const user = await fetchCurrentUser(token);
        setSession((prev) => ({
          token: prev?.token || token || "",
          user: {
            ...user,
            name: user.name || user.username || String(user.email || "User").split("@")[0],
          },
          remember: Boolean(prev?.remember),
        }));
      } catch {
        setSession(null);
        localStorage.removeItem(SESSION_KEY);
      }
    }
    bootstrap();
  }, []);

  useEffect(() => {
    loadData();
  }, [session?.token, session?.user?.role]);

  const notificationCount = unreadNotifications;
  const navItems = useMemo(() => getNavItems(session?.user?.role), [session?.user?.role]);
  const isAdmin = session?.user?.role === "admin" || session?.user?.role === "super_admin";
  const isSuperAdmin = session?.user?.role === "super_admin";
  const allowedPages = useMemo(() => new Set(navItems.map((item) => item.key)), [navItems]);

  useEffect(() => {
    if (!allowedPages.has(currentPage)) {
      setCurrentPage("dashboard");
    }
  }, [allowedPages, currentPage]);

  useEffect(() => {
    if (!globalError) return;
    const timer = window.setTimeout(() => setGlobalError(""), 5000);
    return () => window.clearTimeout(timer);
  }, [globalError]);

  useEffect(() => {
    if (currentPage === "activity") {
      setUnreadNotifications(0);
    }
  }, [currentPage]);

  async function handleLogin(payload) {
    const email = String(payload.email || "").trim().toLowerCase();

    if (payload.mode === "register") {
      const registerResult = await registerUser({
        username: String(payload.username || "").trim(),
        email,
        password: payload.password,
        role: payload.role || "user",
        newAdminKey: payload.newAdminKey || "",
      });
      return {
        ...registerResult,
        justRegistered: true,
      };
    }

    const loginResult = await loginUser({
      identifier: payload.identifier,
      password: payload.password,
    });
    const user = {
      ...loginResult.user,
      name: loginResult.user?.username || String(loginResult.user?.email || "User").split("@")[0],
    };
    const next = {
      token: loginResult.access_token || "",
      user,
      remember: payload.remember,
    };
    const deferSessionMs = Number(payload.deferSessionMs) || 0;
    if (deferSessionMs > 0) {
      await new Promise((resolve) => window.setTimeout(resolve, deferSessionMs));
    }
    setSession(next);
    if (payload.remember) {
      localStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
          user: next.user,
          remember: true,
          token: "",
        }),
      );
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
    addActivity("Login", `${user.email} signed in as ${user.role}`);
    return { justRegistered: false };
  }

  async function handleLogout() {
    try {
      await logoutUser();
    } catch {
      // Continue local cleanup even if backend logout fails.
    } finally {
      setSession(null);
      localStorage.removeItem(SESSION_KEY);
      setCurrentPage("dashboard");
      setStats(null);
      setDocuments([]);
      setUsers([]);
      setUploadHistory([]);
      setActivityLog([]);
      setUnreadNotifications(0);
    }
  }

  async function handleUpload(file) {
    setUploading(true);
    setGlobalError("");
    try {
      const result = await uploadDocument(file, session.token);
      setUploadHistory((prev) => [
        ...prev,
        {
          documentId: result.document_id || "",
          filename: result.filename || file.name,
          time: new Date().toLocaleString(),
        },
      ]);
      addActivity("Upload", `Uploaded ${result.filename || file.name}`);
      await loadData();
    } catch (err) {
      setGlobalError(err.message || "Upload failed");
      addActivity("Upload Failed", err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleOpenDetails(docId) {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailError("");
    setSelectedDocument(null);

    try {
      const detail = await fetchDocumentById(docId, session.token);
      setSelectedDocument(normalizeDetailPayload(detail));
      addActivity("Inspect Document", `Opened detail view for ${docId}`);
    } catch (err) {
      setDetailError(err.message || "Failed to load document detail");
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleDeleteDocument(doc) {
    if (!doc?.id) return;
    const confirmed = window.confirm(`Delete "${doc.filename || "this document"}"?`);
    if (!confirmed) return;

    try {
      await deleteDocumentById(doc.id, session.token);
      addActivity("Delete Document", `Deleted ${doc.filename || doc.id}`);
      await loadData();
    } catch (err) {
      setGlobalError(err.message || "Delete failed");
      addActivity("Delete Failed", err.message || "Delete failed");
    }
  }

  async function handlePromoteUser(user) {
    if (!user?.id) return;
    try {
      await updateUserRole(user.id, "admin", session.token);
      addActivity("Role Updated", `Promoted ${user.email} to admin`);
      await loadData();
    } catch (err) {
      setGlobalError(err.message || "Failed to promote user");
      addActivity("Role Update Failed", err.message || "Failed to promote user");
    }
  }

  async function handleDemoteUser(user) {
    if (!user?.id) return;
    try {
      await updateUserRole(user.id, "user", session.token);
      addActivity("Role Updated", `Demoted ${user.email} to user`);
      await loadData();
    } catch (err) {
      setGlobalError(err.message || "Failed to demote user");
      addActivity("Role Update Failed", err.message || "Failed to demote user");
    }
  }

  async function handleDeleteUser(user) {
    if (!user?.id) return;
    const confirmed = window.confirm(`Delete user "${user.email}"?`);
    if (!confirmed) return;
    try {
      await deleteUserById(user.id, session.token);
      addActivity("User Deleted", `Deleted ${user.email}`);
      await loadData();
    } catch (err) {
      setGlobalError(err.message || "Failed to delete user");
      addActivity("User Delete Failed", err.message || "Failed to delete user");
    }
  }

  async function handleTransferSuperAdmin(user) {
    if (!user?.id) return;
    const confirmed = window.confirm(`Transfer super admin role to "${user.email}"?`);
    if (!confirmed) return;
    try {
      await transferSuperAdmin(user.id, session.token);
      addActivity("Role Transfer", `Transferred super admin to ${user.email}`);
      const refreshed = await fetchCurrentUser(session.token);
      setSession((prev) => ({
        ...(prev || {}),
        user: {
          ...refreshed,
          name: refreshed.name || refreshed.username || String(refreshed.email || "User").split("@")[0],
        },
      }));
      await loadData();
    } catch (err) {
      setGlobalError(err.message || "Failed to transfer super admin");
      addActivity("Role Transfer Failed", err.message || "Failed to transfer super admin");
    }
  }

  async function handleOpenUploadHistoryItem(item) {
    if (!item) return;
    setCurrentPage("documents");

    if (item.documentId) {
      await handleOpenDetails(item.documentId);
      return;
    }

    const matched = documents.find((doc) => doc.filename === item.filename);
    if (matched?.id) {
      await handleOpenDetails(matched.id);
      return;
    }

    try {
      const docsData = await fetchDocuments(session.token);
      const nextDocs = Array.isArray(docsData) ? docsData : [];
      setDocuments(nextDocs);
      const nextMatch = nextDocs.find((doc) => doc.filename === item.filename);
      if (nextMatch?.id) {
        await handleOpenDetails(nextMatch.id);
      } else {
        setGlobalError("Document not found in My Documents.");
      }
    } catch (err) {
      setGlobalError(err.message || "Failed to open document from history");
    }
  }

  function renderPage() {
    if (currentPage === "dashboard") {
      return (
        <Dashboard
          stats={stats}
          documents={documents}
          onNavigate={setCurrentPage}
          onQuickUpload={() => setCurrentPage("upload")}
          canUpload={allowedPages.has("upload")}
          isAdmin={isAdmin}
          onOpenDocument={handleOpenDetails}
        />
      );
    }

    if (currentPage === "upload") {
      return (
        <Upload
          uploading={uploading}
          onUpload={handleUpload}
          uploadHistory={uploadHistory}
          onOpenDocuments={() => setCurrentPage("documents")}
          onOpenHistoryItem={handleOpenUploadHistoryItem}
        />
      );
    }

    if (currentPage === "documents") {
      return (
        <Documents
          documents={documents}
          loading={loading}
          onView={handleOpenDetails}
          onDelete={handleDeleteDocument}
        />
      );
    }

    if (currentPage === "users") {
      if (!isAdmin) {
        return (
          <section className="page-stack">
            <article className="glass-card panel">
              <h3>Access Restricted</h3>
              <p className="muted">You do not have permission to view this page.</p>
            </article>
          </section>
        );
      }
      return (
        <Users
          users={users}
          loading={loading}
          currentUser={session.user}
          canManageRoles={isSuperAdmin}
          onPromote={handlePromoteUser}
          onDemote={handleDemoteUser}
          onDeleteUser={handleDeleteUser}
          onTransferSuperAdmin={handleTransferSuperAdmin}
        />
      );
    }

    if (currentPage === "analytics") {
      return <Analytics stats={stats} documents={documents} />;
    }

    if (currentPage === "settings") {
      return <Settings theme={theme} onThemeToggle={() => setTheme((p) => (p === "dark" ? "light" : "dark"))} user={session.user} />;
    }

    return <Activity items={activityLog} />;
  }

  if (!session) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app-shell">
      <Sidebar
        items={navItems}
        currentPage={currentPage}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((prev) => !prev)}
        onNavigate={setCurrentPage}
        onLogout={handleLogout}
      />

      <div className="content-shell">
        <Topbar
          theme={theme}
          onThemeToggle={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
          backendHealth={health}
          user={session.user}
          notifications={notificationCount}
          onNotificationsClick={() => setCurrentPage("activity")}
        />

        {globalError && <p className="error-banner toast-in">{globalError}</p>}
        <div key={currentPage} className="page-transition">
          {renderPage()}
        </div>
      </div>

      <DetailModal
        open={detailOpen}
        loading={detailLoading}
        error={detailError}
        document={selectedDocument}
        onClose={() => setDetailOpen(false)}
      />
    </div>
  );
}

export default App;
