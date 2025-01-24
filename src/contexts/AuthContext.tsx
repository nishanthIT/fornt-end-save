import { createContext, useContext, useState, ReactNode } from "react";

interface User {
  id: number;
  name: string;
  role: "admin" | "employee";
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users - replace with actual authentication later
const mockUsers = [
  { id: 1, email: "admin@example.com", password: "admin123", name: "Admin User", role: "admin" as const },
  { id: 2, email: "employee@example.com", password: "emp123", name: "John Employee", role: "employee" as const },
];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = (email: string, password: string) => {
    const foundUser = mockUsers.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    
    if (foundUser) {
      const { password: _, email: __, ...userWithoutSensitiveInfo } = foundUser;
      setUser(userWithoutSensitiveInfo);
    }
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
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