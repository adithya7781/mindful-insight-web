
import React, { createContext, useContext, useState, useEffect } from "react";
import { User, AuthState } from "@/types";

// Initial auth state
const initialState: AuthState = {
  user: null,
  isLoading: true,
  error: null,
};

// Mock database for demonstration purposes (would connect to backend in production)
const USERS_DB: User[] = [
  {
    id: "1",
    name: "Admin User",
    email: "admin@company.com",
    role: "admin",
    isApproved: true,
    createdAt: new Date(),
  },
  {
    id: "2",
    name: "IT User",
    email: "user@company.com",
    role: "user",
    isApproved: true,
    createdAt: new Date(),
  },
];

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (name: string, email: string, password: string) => Promise<void>;
  approveUser: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>(initialState);

  // Check for existing session
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setState({
        user: JSON.parse(storedUser),
        isLoading: false,
        error: null,
      });
    } else {
      setState((prevState) => ({
        ...prevState,
        isLoading: false,
      }));
    }
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    setState((prevState) => ({ ...prevState, isLoading: true, error: null }));
    
    try {
      // Simulate API call/database check
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Validate email and password (mock validation - would check against hashed passwords in real app)
      const user = USERS_DB.find((u) => u.email.toLowerCase() === email.toLowerCase());
      
      if (!user) {
        throw new Error("Invalid email or password");
      }
      
      // In real app, would validate password hash here
      
      // Store user in local storage for persistence
      localStorage.setItem("user", JSON.stringify(user));
      
      setState({
        user,
        isLoading: false,
        error: null,
      });
      
    } catch (error) {
      setState({
        user: null,
        isLoading: false,
        error: error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem("user");
    setState({
      user: null,
      isLoading: false,
      error: null,
    });
  };

  // Register function
  const register = async (name: string, email: string, password: string) => {
    setState((prevState) => ({ ...prevState, isLoading: true, error: null }));
    
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Check if email already exists
      const existingUser = USERS_DB.find((u) => u.email.toLowerCase() === email.toLowerCase());
      
      if (existingUser) {
        throw new Error("Email already exists");
      }
      
      // Create new user (would hash password in real app)
      const newUser: User = {
        id: (USERS_DB.length + 1).toString(),
        name,
        email,
        role: "user", // Default role is IT professional
        isApproved: false, // Needs admin approval
        createdAt: new Date(),
      };
      
      // Add to mock database
      USERS_DB.push(newUser);
      
      setState({
        user: null,
        isLoading: false,
        error: null,
      });
      
    } catch (error) {
      setState({
        user: null,
        isLoading: false,
        error: error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  };

  // Approve user function (admin only)
  const approveUser = async (userId: string) => {
    setState((prevState) => ({ ...prevState, isLoading: true, error: null }));
    
    try {
      // Check if current user is admin
      if (state.user?.role !== "admin") {
        throw new Error("Unauthorized");
      }
      
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Find user to approve
      const userIndex = USERS_DB.findIndex((u) => u.id === userId);
      
      if (userIndex === -1) {
        throw new Error("User not found");
      }
      
      // Update user approval status
      USERS_DB[userIndex].isApproved = true;
      
      setState((prevState) => ({
        ...prevState,
        isLoading: false,
      }));
      
    } catch (error) {
      setState((prevState) => ({
        ...prevState,
        isLoading: false,
        error: error instanceof Error ? error.message : "An unknown error occurred",
      }));
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
