const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080/api";

export function getToken() {
  return localStorage.getItem("unipop_token");
}

export function setSession(data) {
  localStorage.setItem("unipop_token", data.token);
  localStorage.setItem("unipop_user", JSON.stringify(data));
}

export function clearSession() {
  localStorage.removeItem("unipop_token");
  localStorage.removeItem("unipop_user");
}

export function getStoredUser() {
  const raw = localStorage.getItem("unipop_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Core fetch wrapper: attaches the JWT and turns API errors into Error objects. */
export async function api(path, { method = "GET", body, signal } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });

  if (res.status === 204) return null;

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const message =
      (data && typeof data === "object" && data.message) ||
      (typeof data === "string" && data) ||
      `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const authApi = {
  login: (email, password) =>
    api("/auth/login", { method: "POST", body: { email, password } }),
  register: (payload) =>
    api("/auth/register", { method: "POST", body: payload }),
};

export const productApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") qs.append(k, v);
    });
    const query = qs.toString();
    return api(`/products${query ? `?${query}` : ""}`);
  },
  get: (id) => api(`/products/${id}`),
  create: (payload) => api("/products", { method: "POST", body: payload }),
  update: (id, payload) =>
    api(`/products/${id}`, { method: "PUT", body: payload }),
  remove: (id) => api(`/products/${id}`, { method: "DELETE" }),
  categories: () => api("/categories"),
};

export const savedApi = {
  list: () => api("/saved"),
  save: (productId) => api(`/saved/${productId}`, { method: "POST" }),
  unsave: (productId) => api(`/saved/${productId}`, { method: "DELETE" }),
};

export const reviewApi = {
  list: (userId) => api(`/users/${userId}/reviews`),
  create: (payload) => api("/reviews", { method: "POST", body: payload }),
  remove: (reviewId) => api(`/reviews/${reviewId}`, { method: "DELETE" }),
};

export const conversationApi = {
  list: () => api("/conversations"),
  start: (recipientId, productId) =>
    api("/conversations", { method: "POST", body: { recipientId, productId } }),
  messages: (id) => api(`/conversations/${id}/messages`),
  send: (id, content) =>
    api(`/conversations/${id}/messages`, { method: "POST", body: { content } }),
  markRead: (id) => api(`/conversations/${id}/read`, { method: "POST" }),
  /** Have I sent at least one message to this student? (review gate) */
  contacted: (userId) => api(`/conversations/contacted/${userId}`),
};

export const userApi = {
  get: (id) => api(`/users/${id}`),
  update: (id, payload) =>
    api(`/users/${id}`, { method: "PUT", body: payload }),
  updatePassword: (id, currentPassword, newPassword) =>
    api(`/users/${id}/password`, {
      method: "PATCH",
      body: { currentPassword, newPassword },
    }),
  remove: (id) => api(`/users/${id}`, { method: "DELETE" }),
};
