import React, { createContext, useContext, useState, useEffect } from "react";
import { User, AuthState } from "@/types";
import { toast } from "sonner";

// API URL from environment or fallback to deployed API
const API_BASE_URL = import.meta.env.VITE_API_URL || "https://workplace-wellness-api.onrender.com";

// Test users for offline/demo mode
const TEST_USERS = {
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
  }
};

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
      
      // Check if it's a demo token
      try {
        const demoData = JSON.parse(atob(token.split('.')[1]));
        if (demoData && demoData.isDemoUser) {
          // Restore demo user from localStorage
          const storedUser = localStorage.getItem("demoUser");
          if (storedUser) {
            const user = JSON.parse(storedUser);
            setState({
              user,
              isLoading: false,
              error: null,
            });
            return;
          }
        }
      } catch (err) {
        // Not a demo token, continue with normal flow
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
    
    // Check if this is a test user for offline/demo mode
    const testUser = TEST_USERS[email.toLowerCase()];
    if (testUser && testUser.password === password) {
      // Create a demo user object without the password
      const demoUser = { ...testUser };
      delete demoUser.password;
      
      // Create a simple demo token
      const demoToken = createDemoToken(demoUser.id);
      
      // Store token and user in localStorage
      localStorage.setItem("token", demoToken);
      localStorage.setItem("demoUser", JSON.stringify(demoUser));
      
      // Convert the demo user to match the User type in our application
      const formattedUser: User = {
        id: demoUser.id,
        name: demoUser.name,
        email: demoUser.email,
        role: demoUser.role as "admin" | "user",
        // Fix: correctly map is_approved (snake_case) to isApproved (camelCase)!
        isApproved: demoUser.is_approved === undefined ? true : demoUser.is_approved,
        createdAt: new Date()
      };
      
      setState({
        user: formattedUser,
        isLoading: false,
        error: null,
      });
      
      toast.success("Logged in successfully");
      return;
    }
    
    try {
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
      
      // Check if this is a test user as fallback after connection error
      const testUser = TEST_USERS[email.toLowerCase()];
      if (testUser && testUser.password === password) {
        // Create a demo user object without the password
        const demoUser = { ...testUser };
        delete demoUser.password;
        
        // Create a simple demo token
        const demoToken = createDemoToken(demoUser.id);
        
        // Store token and user in localStorage
        localStorage.setItem("token", demoToken);
        localStorage.setItem("demoUser", JSON.stringify(demoUser));
        
        // Convert the demo user to match the User type in our application
        const formattedUser: User = {
          id: demoUser.id,
          name: demoUser.name,
          email: demoUser.email,
          role: demoUser.role as "admin" | "user",
          isApproved: demoUser.is_approved,
          createdAt: new Date()
        };
        
        setState({
          user: formattedUser,
          isLoading: false,
          error: null,
        });
        
        toast.success("Logged in successfully");
        return;
      }
      
      setState({
        user: null,
        isLoading: false,
        error: "Invalid email or password",
      });
      toast.error("Invalid email or password");
    }
  };

  // Create a simple demo token
  const createDemoToken = (userId: string) => {
    // Create a very simple JWT-like token structure
    const header = btoa(JSON.stringify({ alg: "none", typ: "JWT" }));
    const payload = btoa(JSON.stringify({ 
      user_id: userId,
      isDemoUser: true,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    }));
    const signature = btoa("demo-signature");
    
    return `${header}.${payload}.${signature}`;
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("demoUser");
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
        body: JSON.stringify({ 
          name, 
          email, 
          password,
          // If the email is the admin email, set role to admin
          role: email === "adivishal2004@gmail.com" ? "admin" : "user"
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setState({
          user: null,
          isLoading: false,
          error: null,
        });
        
        // Auto-approve admin account
        if (email === "adivishal2004@gmail.com") {
          toast.success("Admin registration successful. You can now log in.");
        } else {
          toast.success("Registration successful. Please wait for admin approval.");
        }
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
        error: "Connection error. Please try again later.",
      });
      toast.error("Registration failed. Please check your internet connection and try again.");
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
