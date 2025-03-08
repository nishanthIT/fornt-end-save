// import { createContext, useContext, useState, ReactNode,useEffect } from "react";

// interface User {
//   id: number;
//   name: string;
//   role: "admin" | "employee";
// }

// interface AuthContextType {
//   user: User | null;
//   login: (email: string, password: string) => void;
//   logout: () => void;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// // Mock users - replace with actual authentication later
// const mockUsers = [
//   { id: 1, email: "admin@example.com", password: "admin123", name: "Admin User", role: "admin" as const },
//   { id: 2, email: "employee@example.com", password: "emp123", name: "John Employee", role: "employee" as const },
// ];

// export const AuthProvider = ({ children }: { children: ReactNode }) => {
//   const [user, setUser] = useState<User | null>(null);

//   useEffect(() => {
//     // Auto-login with admin user
//     const adminUser = mockUsers.find((u) => u.role === "admin");
//     if (adminUser) {
//       const { password: _, email: __, ...userWithoutSensitiveInfo } = adminUser;
//       setUser(userWithoutSensitiveInfo);
//     }
//   }, []);

//   const login = (email: string, password: string) => {
//     const foundUser = mockUsers.find(
//       (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
//     );
    
//     if (foundUser) {
//       const { password: _, email: __, ...userWithoutSensitiveInfo } = foundUser;
//       setUser(userWithoutSensitiveInfo);
//     }
//   };

//   const logout = () => {
//     setUser(null);
//   };

//   return (
//     <AuthContext.Provider value={{ user, login, logout }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (context === undefined) {
//     throw new Error("useAuth must be used within an AuthProvider");
//   }
//   return context;
// };






// import { createContext, useContext, useState, ReactNode, useEffect } from "react";
// import axios from "axios";
// import { useNavigate } from "react-router-dom";

// interface User {
//   id: number;
//   email: string;
//   userType: "ADMIN" | "EMPLOYEE" | "CUSTOMER";
//   name?: string;
// }

// interface AuthContextType {
//   user: User | null;
//   login: (email: string, password: string, userType: "ADMIN" | "EMPLOYEE" | "CUSTOMER") => Promise<void>;
//   logout: () => Promise<void>;
//   loading: boolean;
//   checkAuthStatus: () => Promise<boolean>;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// // Set up axios defaults
// axios.defaults.baseURL = "http://localhost:3000/api"; // Adjusted to include /api
// axios.defaults.withCredentials = true;

// // Axios interceptor for handling unauthorized responses
// axios.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response && (error.response.status === 401 || error.response.status === 403)) {
//       // Clear any local user data
//       localStorage.removeItem("user");
      
//       // If we're not already on the login page, redirect
//       if (window.location.pathname !== "/login") {
//         window.location.href = "/login";
//       }
//     }
//     return Promise.reject(error);
//   }
// );

// export const AuthProvider = ({ children }: { children: ReactNode }) => {
//   const [user, setUser] = useState<User | null>(null);
//   const [loading, setLoading] = useState<boolean>(true);
  
//   // This effect runs once on component mount to check auth status
//   useEffect(() => {
//     checkAuthStatus()
//       .then(() => setLoading(false))
//       .catch(() => setLoading(false));
//   }, []);
// console.log("hide auth status")
//   const checkAuthStatus = async (): Promise<boolean> => {
//     try {
//       const response = await axios.get("/auth/me");
//       if (response.data.user) {
//         setUser(response.data.user);
       
//         return true;
//       }
//       return false;
//     } catch (err) {
//       // JWT expired or not present
//       setUser(null);
//       return false;
//     }
//   };

//   const login = async (email: string, password: string, userType: "ADMIN" | "EMPLOYEE" | "CUSTOMER") => {
//     setLoading(true);
    
//     try {
//       const response = await axios.post("/auth/login", {
//         email,
//         password,
//         userType
//       });
      
//       setUser(response.data.user);
//       console.log(response)
//       console.log(response.data.user)
//     } catch (err) {
//       throw err;
//     } finally {
//       setLoading(false);
//     }
//   };

//   const logout = async () => {
//     setLoading(true);
    
//     try {
//       await axios.post("/auth/logout");
//       setUser(null);
//       window.location.href = "/login"; // Force redirect to login after logout
//     } catch (err) {
//       console.error("Logout failed:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <AuthContext.Provider value={{ user, login, logout, loading, checkAuthStatus }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (context === undefined) {
//     throw new Error("useAuth must be used within an AuthProvider");
//   }
//   return context;
// };














// import { createContext, useContext, useState, ReactNode, useEffect } from "react";
// import axios from "axios";

// interface User {
//   id: number;
//   email: string;
//   userType: "ADMIN" | "EMPLOYEE" | "CUSTOMER";
//   name?: string;
// }

// interface AuthContextType {
//   user: User | null;
//   login: (email: string, password: string, userType: "ADMIN" | "EMPLOYEE" | "CUSTOMER") => Promise<void>;
//   logout: () => Promise<void>;
//   loading: boolean;
//   checkAuthStatus: () => Promise<boolean>;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// // Axios defaults: allow cookies in all requests
// axios.defaults.baseURL = "http://localhost:3000/api";
// axios.defaults.withCredentials = true; // Ensures cookies are sent with requests

// export const AuthProvider = ({ children }: { children: ReactNode }) => {
//   const [user, setUser] = useState<User | null>(null);
//   const [loading, setLoading] = useState<boolean>(true);

//   // Check authentication status on mount
//   useEffect(() => {
//     checkAuthStatus();
//   }, []);

//   const checkAuthStatus = async (): Promise<boolean> => {
//     setLoading(true);
//     try {
//       const response = await axios.get("/auth/me"); // Cookie is sent automatically
//       if (response.data.user) {
//         setUser(response.data.user);
//         return true;
//       }
//       return false;
//     } catch (err) {
//       console.error("Auth check failed:", err);
//       setUser(null);
//       return false;
//     } finally {
//       setLoading(false);
//     }
//   };

//   const login = async (email: string, password: string, userType: "ADMIN" | "EMPLOYEE" | "CUSTOMER") => {
//     setLoading(true);
//     try {
//       const response = await axios.post("/auth/login", {
//         email,
//         password,
//         userType,
//       });



//       // The browser stores the auth_token automatically, so no need to manually save it
//       setUser(response.data.user);
//       console.log(response.data.user)
//     } catch (err) {
//       console.error("Login failed:", err);
//       throw err;
//     } finally {
//       setLoading(false);
//     }
//   };

//   const logout = async () => {
//     setLoading(true);
//     try {
//       await axios.post("/auth/logout");
//       setUser(null);
//       window.location.href = "/login"; // Redirect to login
//     } catch (err) {
//       console.error("Logout failed:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <AuthContext.Provider value={{ user, login, logout, loading, checkAuthStatus }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (context === undefined) {
//     throw new Error("useAuth must be used within an AuthProvider");
//   }
//   return context;
// };





import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import axios from "axios";

interface User {
  id: number;
  email: string;
  userType: "ADMIN" | "EMPLOYEE" | "CUSTOMER";
  name?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, userType: "ADMIN" | "EMPLOYEE" | "CUSTOMER") => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  checkAuthStatus: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Configure axios
axios.defaults.baseURL = "http://localhost:3000/api";
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
      
      if (response.data.user) {
        console.log("User authenticated:", response.data.user);
        setUser(response.data.user);
        return true;
      }
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

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, checkAuthStatus }}>
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