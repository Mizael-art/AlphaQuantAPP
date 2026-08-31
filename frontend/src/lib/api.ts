/**
 * Thin fetch wrapper for the AlphaQuant X backend.
 * Base URL comes from VITE_API_URL (see .env.example). Admin requests
 * include credentials so the httpOnly session cookie set by
 * POST /api/admin/login is sent automatically.
 */

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const adminToken = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("aq_admin_token") : null;
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body.message ?? body.error ?? message;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(res.status, message);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body ?? {}) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body ?? {}) }),
};

// --- Public endpoints -------------------------------------------------
export const publicApi = {
  overview: () => api.get<any>("/api/public/overview"),
  openTrades: () => api.get<any[]>("/api/public/open-trades"),
  calls: () => api.get<any[]>("/api/public/calls"),
  trades: (params: { page?: number; pageSize?: number; asset?: string; status?: string } = {}) => {
    const q = new URLSearchParams(params as any).toString();
    return api.get<{ items: any[]; total: number; page: number; pageSize: number }>(
      `/api/public/trades${q ? `?${q}` : ""}`,
    );
  },
  trade: (id: string) => api.get<any>(`/api/public/trades/${id}`),
  performance: () => api.get<any>("/api/public/performance"),
  reports: (period: "daily" | "weekly" | "monthly" | "all-time") =>
    api.get<any[]>(`/api/public/reports?period=${period}`),
};

// --- Admin endpoints ----------------------------------------------------
export const adminApi = {
  login: (email: string, password: string) => api.post<{ token: string; user: any }>("/api/admin/login", { email, password }),
  logout: () => api.post("/api/admin/logout"),
  createCall: (body: any) => api.post<any>("/api/admin/calls", body),
  updateCall: (id: string, body: any) => api.patch<any>(`/api/admin/calls/${id}`, body),
  closeCall: (id: string) => api.post<any>(`/api/admin/calls/${id}/close`),
  cancelCall: (id: string) => api.post<any>(`/api/admin/calls/${id}/cancel`),
  performance: () => api.get<any[]>("/api/admin/performance"),
  analytics: () => api.get<any>("/api/admin/analytics"),
  runBacktest: (body: any) => api.post<any>("/api/admin/backtest", body),
  registerHistoricalTrade: (body: any) => api.post<any>("/api/admin/historical-trades", body),
  analyzeHistoricalTrade: (id: string) => api.post<any>(`/api/admin/historical-trades/${id}/analyze`),
};
