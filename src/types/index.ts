
export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user"; // admin = HR, user = IT professional
  isApproved: boolean;
  createdAt: Date;
}

export interface StressResult {
  id: string;
  userId: string;
  stressLevel: "low" | "medium" | "high";
  score: number; // 0-100 score
  imageUrl?: string;
  createdAt: Date;
  notes?: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}
