
export const TEST_USERS = {
  "demo@example.com": {
    id: "demo-user-id",
    name: "Demo User",
    email: "demo@example.com",
    password: "demo@123",
    role: "user",
    is_approved: true,
  },
  "admin@example.com": {
    id: "admin-user-id",
    name: "Admin User",
    email: "admin@example.com",
    password: "admin@123",
    role: "admin",
    is_approved: true,
  },
};

export function createDemoToken(userId: string) {
  // Simple JWT-like token structure for demo users
  const header = btoa(JSON.stringify({ alg: "none", typ: "JWT" }));
  const payload = btoa(JSON.stringify({
    user_id: userId,
    isDemoUser: true,
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
  }));
  const signature = btoa("demo-signature");
  return `${header}.${payload}.${signature}`;
}

export function restoreDemoUserFromLocalStorage() {
  const storedUser = localStorage.getItem("demoUser");
  if (storedUser) {
    const user = JSON.parse(storedUser);
    return { ...user, isApproved: true };
  }
  return null;
}

export function parseDemoToken(token: string) {
  try {
    const demoData = JSON.parse(atob(token.split('.')[1]));
    return demoData.isDemoUser ? demoData : null;
  } catch {
    return null;
  }
}
