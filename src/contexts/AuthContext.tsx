
import React, { createContext, useContext, useState, useEffect } from "react";
import { User, AuthState } from "@/types";
import { toast } from "sonner";

// API URL from environment
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

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
      setState({
        user: null,
        isLoading: false,
        error: "Connection error. Please try again.",
      });
      toast.error("Connection error. Please try again.");
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
      setState({
        user: null,
        isLoading: false,
        error: "Connection error. Please try again.",
      });
      toast.error("Connection error. Please try again.");
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
