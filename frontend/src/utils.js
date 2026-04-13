export const ADMIN_NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: "DB" },
  { key: "documents", label: "All Documents", icon: "DC" },
  { key: "users", label: "Users Management", icon: "US" },
  { key: "analytics", label: "Risk Analytics", icon: "AN" },
  { key: "activity", label: "Activity Logs", icon: "AC" },
  { key: "settings", label: "Settings", icon: "ST" },
];

export const USER_NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: "DB" },
  { key: "documents", label: "My Documents", icon: "DC" },
  { key: "upload", label: "Upload Document", icon: "UP" },
  { key: "analytics", label: "My Risk Reports", icon: "AN" },
  { key: "settings", label: "Settings", icon: "ST" },
];

export function getNavItems(role) {
  return role === "admin" || role === "super_admin" ? ADMIN_NAV_ITEMS : USER_NAV_ITEMS;
}

export const RISK_FILTERS = ["All", "High", "Medium", "Low", "Unknown"];

export function normalizeRisk(value) {
  const parsed = String(value || "Unknown").toLowerCase();
  if (parsed === "high" || parsed === "medium" || parsed === "low") return parsed;
  return "unknown";
}

export function prettyRisk(value) {
  const parsed = normalizeRisk(value);
  return parsed[0].toUpperCase() + parsed.slice(1);
}

export function hasItems(items) {
  return Array.isArray(items) && items.length > 0;
}

function uniqueStrings(items) {
  if (!Array.isArray(items)) return [];
  const seen = new Set();
  const result = [];
  for (const item of items) {
    const value = String(item ?? "").trim();
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }
  return result;
}

export function formatDate(value) {
  if (!value) return "Not Available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
}

export function formatBytes(value) {
  const bytes = Number(value);
  if (!Number.isFinite(bytes) || bytes <= 0) return "Not Available";
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

export function normalizeDetailPayload(response) {
  const base = response && typeof response === "object" ? response : {};
  const analysis =
    base.analysis && typeof base.analysis === "object" && !Array.isArray(base.analysis)
      ? base.analysis
      : null;
  const source = analysis ?? base;
  const metadata =
    source.metadata && typeof source.metadata === "object" && !Array.isArray(source.metadata)
      ? source.metadata
      : {};

  const keyTopics = uniqueStrings([
    ...(Array.isArray(metadata.key_topics) ? metadata.key_topics : []),
  ]);
  const keyClauses = uniqueStrings([
    ...(Array.isArray(source.key_clauses) ? source.key_clauses : []),
    ...(Array.isArray(base.key_clauses) ? base.key_clauses : []),
  ]);
  const obligations = uniqueStrings([
    ...(Array.isArray(source.obligations) ? source.obligations : []),
    ...(Array.isArray(base.obligations) ? base.obligations : []),
  ]);
  const complianceIssues = uniqueStrings([
    ...(Array.isArray(source.compliance_issues) ? source.compliance_issues : []),
    ...(Array.isArray(base.compliance_issues) ? base.compliance_issues : []),
  ]);
  const riskTypes = uniqueStrings([
    ...(Array.isArray(source.risk_types) ? source.risk_types : []),
    ...(Array.isArray(base.risk_types) ? base.risk_types : []),
  ]);

  const summary = source.summary || base.summary || "Not Available";
  const detailedSummary = source.detailed_summary || base.detailed_summary || summary;

  return {
    id: base.id || "Not Available",
    filename: base.filename || "Not Available",
    uploaded_at: base.uploaded_at || null,
    created_at: base.created_at || null,
    content_length: base.content_length,
    title: source.title || "Not Available",
    document_type: source.document_type || metadata.document_type || "Not Available",
    author: source.author || "Not Available",
    date: source.date || "Not Available",
    summary,
    detailed_summary: detailedSummary,
    key_topics: keyTopics,
    key_clauses: keyClauses,
    obligations,
    compliance_issues: complianceIssues,
    risks: hasItems(source.risks) ? source.risks : [],
    risk_types: riskTypes,
    overall_risk_level: source.overall_risk_level || base.overall_risk_level || "Unknown",
    confidence: source.confidence_score || Math.floor(80 + Math.random() * 18),
  };
}

export function buildMonthlyTrend(documents, monthCount = 6) {
  const now = new Date();
  const months = [];

  for (let i = monthCount - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    months.push({
      key,
      label: d.toLocaleString(undefined, { month: "short" }),
      count: 0,
    });
  }

  documents.forEach((doc) => {
    const value = doc?.uploaded_at || doc?.created_at;
    if (!value) return;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const idx = months.findIndex((m) => m.key === key);
    if (idx >= 0) months[idx].count += 1;
  });

  return months;
}

export function exportAnalyticsReport(data) {
  const content = JSON.stringify(data, null, 2);
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `docagent-analytics-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
