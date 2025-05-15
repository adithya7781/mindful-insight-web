
const API_BASE_URL = import.meta.env.VITE_API_URL || "https://workplace-wellness-api.onrender.com";

export async function apiLogin(email: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return response.json();
}

export async function apiRegister(name: string, email: string, password: string, role: string) {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password, role }),
  });
  return response.json();
}

export async function apiProfile(token: string) {
  const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
}

export async function apiApproveUser(userId: string, token: string) {
  const response = await fetch(`${API_BASE_URL}/api/admin/users/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    body: JSON.stringify({ user_id: userId }),
  });
  return response.json();
}
