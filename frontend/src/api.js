function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function _networkError() {
  return new Error("Backend is not reachable. Start Uvicorn and retry.");
}

async function _tryFetch(path, options = {}) {
  try {
    return await fetch(path, {
      credentials: "include",
      ...options,
    });
  } catch {
    throw _networkError();
  }
}

async function apiFetch(path, options = {}) {
  return _tryFetch(path, options);
}

async function authFetch(path, token, options = {}) {
  const headers = { ...(options.headers || {}), ...authHeaders(token) };
  const response = await apiFetch(path, { ...options, headers });
  if (response.status === 401 && token) {
    // Retry once without Authorization header so cookie auth can take precedence.
    return apiFetch(path, options);
  }
  return response;
}

function toErrorMessage(data, fallbackPrefix, status) {
  const detail = data?.detail ?? data?.error;
  if (typeof detail === "string" && detail.trim()) return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    const parts = detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          const field = Array.isArray(item.loc) ? item.loc.slice(1).join(".") : "";
          const msg = item.msg || "";
          return field ? `${field}: ${msg}` : msg;
        }
        return "";
      })
      .filter(Boolean);
    if (parts.length > 0) return parts.join("; ");
  }
  if (detail && typeof detail === "object") return JSON.stringify(detail);
  return `${fallbackPrefix}: ${status}`;
}

async function parseOrThrow(response, fallbackPrefix) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(toErrorMessage(data, fallbackPrefix, response.status));
  }
  return data;
}

export async function fetchHealth() {
  const response = await apiFetch("/api/health");
  return parseOrThrow(response, "Health API failed");
}

export async function fetchSignupMeta() {
  const response = await apiFetch("/api/auth/signup-meta");
  return parseOrThrow(response, "Signup meta failed");
}

export async function registerUser({ username, email, password, role, newAdminKey }) {
  const payload = { username, email, password, role };
  if (newAdminKey && String(newAdminKey).trim()) payload.new_admin_key = String(newAdminKey).trim();
  const response = await apiFetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseOrThrow(response, "Register failed");
}

export async function loginUser({ identifier, password }) {
  const response = await apiFetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, password }),
  });
  return parseOrThrow(response, "Login failed");
}

export async function fetchCurrentUser(token) {
  const response = await authFetch("/api/auth/me", token);
  return parseOrThrow(response, "Auth check failed");
}

export async function fetchDashboardStats(token) {
  const response = await authFetch("/api/dashboard/stats", token);
  return parseOrThrow(response, "Dashboard API failed");
}

export async function fetchDocuments(token) {
  const response = await authFetch("/api/documents", token);
  return parseOrThrow(response, "Documents API failed");
}

export async function fetchUsers(token) {
  const response = await authFetch("/api/users", token);
  return parseOrThrow(response, "Users API failed");
}

export async function updateUserRole(userId, role, token) {
  const response = await authFetch(`/api/users/${userId}/role`, token, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });
  return parseOrThrow(response, "Update user role failed");
}

export async function deleteUserById(userId, token) {
  const response = await authFetch(`/api/users/${userId}`, token, {
    method: "DELETE",
  });
  return parseOrThrow(response, "Delete user failed");
}

export async function transferSuperAdmin(userId, token) {
  const response = await authFetch(`/api/users/transfer-super-admin/${userId}`, token, {
    method: "POST",
  });
  return parseOrThrow(response, "Transfer super admin failed");
}

export async function uploadDocument(file, token) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await authFetch("/api/upload", token, {
    method: "POST",
    body: formData,
  });

  return parseOrThrow(response, "Upload failed");
}

export async function fetchDocumentById(docId, token) {
  const response = await authFetch(`/api/documents/${docId}`, token);
  return parseOrThrow(response, "Document detail API failed");
}

export async function deleteDocumentById(docId, token) {
  const response = await authFetch(`/api/documents/${docId}`, token, {
    method: "DELETE",
  });
  return parseOrThrow(response, "Delete API failed");
}

export async function logoutUser() {
  const response = await apiFetch("/api/auth/logout", { method: "POST" });
  return parseOrThrow(response, "Logout failed");
}
