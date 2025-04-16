
import React, { createContext, useContext, useState, useEffect } from "react";
import { User, AuthState } from "@/types";
import { toast } from "sonner";

// API URL from environment or fallback to deployed API
const API_BASE_URL = import.meta.env.VITE_API_URL || "https://workplace-wellness-api.onrender.com";

// Initial auth state
const initialState: AuthState = {
  user: null,
  isLoading: true,
  error: null,
};

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (name: string, email: string, password: string) => Promise<void>;
  approveUser: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>(initialState);

  // Check for existing token on startup
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setState({ user: null, isLoading: false, error: null });
        return;
      }
      
      try {
        // Verify token with backend
        const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const data = await response.json();
        
        if (data.success) {
          setState({
            user: data.user,
            isLoading: false,
            error: null,
          });
        } else {
          // Token invalid, clear it
          localStorage.removeItem("token");
          setState({
            user: null,
            isLoading: false,
            error: null,
          });
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        localStorage.removeItem("token");
        setState({
          user: null,
          isLoading: false,
          error: null,
        });
      }
    };
    
    checkAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    setState((prevState) => ({ ...prevState, isLoading: true, error: null }));
    
    try {
      // Use demo mode for testing without a backend
      if (email === "demo@example.com" && password === "demo123") {
        const demoUser: User = {
          id: "demo-user-id",
          name: "Demo User",
          email: "demo@example.com",
          role: "user",
          isApproved: true,
          createdAt: new Date(),
        };
        
        localStorage.setItem("token", "demo-token");
        setState({
          user: demoUser,
          isLoading: false,
          error: null,
        });
        
        toast.success("Logged in demo mode successfully");
        return;
      }
      
      // Try to connect to backend
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Store token in local storage
        localStorage.setItem("token", data.token);
        
        setState({
          user: data.user,
          isLoading: false,
          error: null,
        });
        
        toast.success("Logged in successfully");
      } else {
        setState({
          user: null,
          isLoading: false,
          error: data.message || "Login failed",
        });
        toast.error(data.message || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      
      // For demo purposes, allow admin login
      if (email === "admin@example.com" && password === "admin123") {
        const adminUser: User = {
          id: "admin-user-id",
          name: "Admin User",
          email: "admin@example.com",
          role: "admin",
          isApproved: true,
          createdAt: new Date(),
        };
        
        localStorage.setItem("token", "admin-token");
        setState({
          user: adminUser,
          isLoading: false,
          error: null,
        });
        
        toast.success("Logged in as admin successfully");
        return;
      }
      
      setState({
        user: null,
        isLoading: false,
        error: "Connection error. Using demo mode until backend is available.",
      });
      toast.error("Connection error. Try demo@example.com with password demo123");
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem("token");
    setState({
      user: null,
      isLoading: false,
      error: null,
    });
    toast.info("Logged out successfully");
  };

  // Register function
  const register = async (name: string, email: string, password: string) => {
    setState((prevState) => ({ ...prevState, isLoading: true, error: null }));
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setState({
          user: null,
          isLoading: false,
          error: null,
        });
        toast.success("Registration successful. Please wait for admin approval.");
      } else {
        setState({
          user: null,
          isLoading: false,
          error: data.message || "Registration failed",
        });
        toast.error(data.message || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      
      // Demo registration success
      setState({
        user: null,
        isLoading: false,
        error: null,
      });
      toast.success("Demo registration successful. You can now log in with demo@example.com and password demo123");
    }
  };

  // Approve user function (admin only)
  const approveUser = async (userId: string) => {
    setState((prevState) => ({ ...prevState, isLoading: true, error: null }));
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication required");
      }
      
      // For demo admin, just show success
      if (token === "admin-token") {
        setState((prevState) => ({
          ...prevState,
          isLoading: false,
          error: null,
        }));
        toast.success("User approved successfully in demo mode");
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/admin/users/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ user_id: userId }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setState((prevState) => ({
          ...prevState,
          isLoading: false,
          error: null,
        }));
        toast.success(data.message || "User approved successfully");
      } else {
        setState((prevState) => ({
          ...prevState,
          isLoading: false,
          error: data.message || "Failed to approve user",
        }));
        toast.error(data.message || "Failed to approve user");
      }
    } catch (error) {
      console.error("User approval error:", error);
      setState((prevState) => ({
        ...prevState,
        isLoading: false,
        error: error instanceof Error ? error.message : "An unknown error occurred",
      }));
      toast.error("Failed to approve user");
    }
  };
  
  const contextValue: AuthContextType = {
    ...state,
    login,
    logout,
    register,
    approveUser,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
