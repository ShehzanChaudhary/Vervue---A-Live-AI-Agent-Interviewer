const TOKEN_KEY = "hr_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export async function login(email, password) {
  const res = await fetch("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || "Login failed");
  setToken(data.access_token);
}

export async function authFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { ...options.headers, Authorization: `Bearer ${getToken()}` },
  });
  if (res.status === 401) {
    clearToken();
    window.location.href = "/hr/login";
  }
  return res;
}

export async function getMe() {
  const res = await authFetch("/auth/me");
  if (!res.ok) throw new Error("Could not load user");
  return res.json();
}

export function logout() {
  clearToken();
  window.location.href = "/hr/login";
}