
import React, { createContext, useContext, useState, useEffect } from "react";
import { User, AuthState } from "@/types";
import { toast } from "sonner";
import { TEST_USERS, createDemoToken, restoreDemoUserFromLocalStorage, parseDemoToken } from "@/utils/demoUserUtils";
import { apiLogin, apiProfile, apiRegister, apiApproveUser } from "@/services/authApi";

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

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setState({ user: null, isLoading: false, error: null });
        return;
      }
      // Demo user check
      const demoData = parseDemoToken(token);
      if (demoData) {
        const demoUser = restoreDemoUserFromLocalStorage();
        if (demoUser) {
          setState({
            user: { ...demoUser, isApproved: true },
            isLoading: false,
            error: null,
          });
          return;
        }
      }
      // Regular user
      try {
        const data = await apiProfile(token);
        if (data.success) {
          setState({
            user: data.user,
            isLoading: false,
            error: null,
          });
        } else {
          localStorage.removeItem("token");
          setState({ user: null, isLoading: false, error: null });
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        localStorage.removeItem("token");
        setState({ user: null, isLoading: false, error: null });
      }
    };
    checkAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    // Demo user check
    const testUser = TEST_USERS[email.toLowerCase()];
    if (testUser && testUser.password === password) {
      const demoUser = { ...testUser };
      delete demoUser.password;
      const demoToken = createDemoToken(demoUser.id);
      localStorage.setItem("token", demoToken);
      localStorage.setItem("demoUser", JSON.stringify(demoUser));
      // Force isApproved true for demo users
      const formattedUser: User = {
        id: demoUser.id,
        name: demoUser.name,
        email: demoUser.email,
        role: demoUser.role as "admin" | "user",
        isApproved: true,
        createdAt: new Date(),
      };
      setState({ user: formattedUser, isLoading: false, error: null });
      toast.success("Logged in successfully");
      return;
    }
    try {
      const data = await apiLogin(email, password);
      if (data.success) {
        localStorage.setItem("token", data.token);
        setState({ user: data.user, isLoading: false, error: null });
        toast.success("Logged in successfully");
      } else {
        setState({ user: null, isLoading: false, error: data.message || "Login failed" });
        toast.error(data.message || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      const fallbackTestUser = TEST_USERS[email.toLowerCase()];
      if (fallbackTestUser && fallbackTestUser.password === password) {
        const fUser = { ...fallbackTestUser };
        delete fUser.password;
        const fToken = createDemoToken(fUser.id);
        localStorage.setItem("token", fToken);
        localStorage.setItem("demoUser", JSON.stringify(fUser));
        const formattedUser: User = {
          id: fUser.id,
          name: fUser.name,
          email: fUser.email,
          role: fUser.role as "admin" | "user",
          isApproved: true,
          createdAt: new Date(),
        };
        setState({ user: formattedUser, isLoading: false, error: null });
        toast.success("Logged in successfully");
        return;
      }
      setState({ user: null, isLoading: false, error: "Invalid email or password" });
      toast.error("Invalid email or password");
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("demoUser");
    setState({ user: null, isLoading: false, error: null });
    toast.info("Logged out successfully");
  };

  // Register function
  const register = async (name: string, email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    const role = email === "adivishal2004@gmail.com" ? "admin" : "user";
    try {
      const data = await apiRegister(name, email, password, role);
      if (data.success) {
        setState({ user: null, isLoading: false, error: null });
        if (role === "admin") {
          toast.success("Admin registration successful. You can now log in.");
        } else {
          toast.success("Registration successful. Please wait for admin approval.");
        }
      } else {
        setState({ user: null, isLoading: false, error: data.message || "Registration failed" });
        toast.error(data.message || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      setState({ user: null, isLoading: false, error: "Connection error. Please try again later." });
      toast.error("Registration failed. Please check your internet connection and try again.");
    }
  };

  // Approve user function (admin only)
  const approveUser = async (userId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication required");
      const data = await apiApproveUser(userId, token);
      if (data.success) {
        setState(prev => ({ ...prev, isLoading: false, error: null }));
        toast.success(data.message || "User approved successfully");
      } else {
        setState(prev => ({ ...prev, isLoading: false, error: data.message || "Failed to approve user" }));
        toast.error(data.message || "Failed to approve user");
      }
    } catch (error) {
      console.error("User approval error:", error);
      setState(prev => ({
        ...prev,
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
