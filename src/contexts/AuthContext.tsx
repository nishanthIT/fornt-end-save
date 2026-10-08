


import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import axios from "axios";

export type CompanyPermission =
  | "catalog.read"
  | "catalog.write"
  | "shops.manage"
  | "list_items.manage"
  | "price_reports.review"
  | "customers.view"
  | "customers.manage"
  | "staff.manage"
  | "content.manage";

interface CompanyAccess {
  role: string;
  permissions: CompanyPermission[];
}

interface User {
  id: number;
  email: string;
  userType: "ADMIN" | "EMPLOYEE" | "CUSTOMER";
  name?: string;
  // Only company staff membership (or the Admin table) grants access to this dashboard.
  companyAccess: CompanyAccess | null;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, userType: "ADMIN" | "EMPLOYEE" | "CUSTOMER") => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  checkAuthStatus: () => Promise<boolean>;
  can: (permission: CompanyPermission) => boolean;
}

export class NoCompanyAccessError extends Error {}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Configure axios
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
axios.defaults.withCredentials = true;

// Add request interceptor to include token in Authorization header
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async (): Promise<boolean> => {
    setLoading(true);
    try {
      console.log("Checking auth status...");
      console.log("Cookies present:", document.cookie);
      console.log("Token in localStorage:", localStorage.getItem('auth_token'));
      
      const response = await axios.get("/auth/me");
      console.log("verified in reload")
      console.log(response.data.user);
      
      if (response.data.user?.companyAccess) {
        console.log("User authenticated:", response.data.user);
        setUser(response.data.user);
        return true;
      }
      // Shop owners and shop employees have no business in the company dashboard.
      localStorage.removeItem('auth_token');
      setUser(null);
      return false;
    } catch (err) {
      console.error("Auth check failed:", err);
      setUser(null);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string, userType: "ADMIN" | "EMPLOYEE" | "CUSTOMER") => {
    setLoading(true);
    try {
      const response = await axios.post("/auth/login", {
        email,
        password,
        userType,
      });
      
      if (!response.data.user?.companyAccess) {
        await axios.post("/auth/logout").catch(() => undefined);
        throw new NoCompanyAccessError(
          "This account has no company staff access. Shop employees should use the Paymi app."
        );
      }

      // Store the token in localStorage as backup
      if (response.data.token) {
        localStorage.setItem('auth_token', response.data.token);
        console.log("Token saved to localStorage");
      }
      
      console.log("Login successful:", response.data.user);
      console.log("Cookies after login:", document.cookie);
      
      setUser(response.data.user);
    } catch (err) {
      console.error("Login failed:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await axios.post("/auth/logout");
      // Clear localStorage
      localStorage.removeItem('auth_token');
      setUser(null);
      window.location.href = "/login";
    } catch (err) {
      console.error("Logout failed:", err);
      // Still clear localStorage and user state on failed logout
      localStorage.removeItem('auth_token');
      setUser(null);
      window.location.href = "/login";
    } finally {
      setLoading(false);
    }
  };

  const can = (permission: CompanyPermission) =>
    !!user?.companyAccess?.permissions?.includes(permission);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, checkAuthStatus, can }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
