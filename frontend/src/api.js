const API_BASE = typeof window !== "undefined" && window.location.port === "5173" 
  ? "http://localhost:8000/api" 
  : "/api";

export async function fetchOverview() {
  const res = await fetch(`${API_BASE}/overview`);
  if (!res.ok) throw new Error("Failed to load fleet overview");
  return res.json();
}

export async function fetchEquipments() {
  const res = await fetch(`${API_BASE}/equipments`);
  if (!res.ok) throw new Error("Failed to load equipment list");
  return res.json();
}

export async function fetchTimeseries(equipmentId, startDate = null, endDate = null, maxPoints = 1200) {
  let url = `${API_BASE}/equipment/${encodeURIComponent(equipmentId)}/timeseries?max_points=${maxPoints}`;
  if (startDate) url += `&start_date=${encodeURIComponent(startDate)}`;
  if (endDate) url += `&end_date=${encodeURIComponent(endDate)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load equipment timeseries");
  return res.json();
}

export async function fetchAnomalies(equipmentId = null, severity = null, limit = 100, offset = 0) {
  let url = `${API_BASE}/anomalies?limit=${limit}&offset=${offset}`;
  if (equipmentId && equipmentId !== "ALL") url += `&equipment_id=${encodeURIComponent(equipmentId)}`;
  if (severity && severity !== "ALL") url += `&severity=${encodeURIComponent(severity)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load anomalies");
  return res.json();
}

export async function fetchAnomalyDetail(anomalyId) {
  const res = await fetch(`${API_BASE}/anomaly/${anomalyId}`);
  if (!res.ok) throw new Error("Failed to load anomaly details");
  return res.json();
}

export async function fetchMLInsights() {
  const res = await fetch(`${API_BASE}/ml-insights`);
  if (!res.ok) throw new Error("Failed to load ML insights");
  return res.json();
}

export async function uploadDataset(file) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Dataset upload failed");
  }
  return res.json();
}

export async function resetDataset() {
  const res = await fetch(`${API_BASE}/dataset/reset`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to reset dataset");
  return res.json();
}

export function getTemplateDownloadUrl() {
  return `${API_BASE}/template-csv`;
}

export function getAnomalyExportUrl() {
  return `${API_BASE}/export-anomalies`;
}
