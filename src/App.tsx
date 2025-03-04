import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Navbar } from "./components/Navbar";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Shops from "./pages/Shops";
import ShopDetail from "./pages/ShopDetail";
import EditProductPrice from "./pages/EditProductPrice";
import AddProduct from "./pages/AddProduct";
import Customers from "./pages/Customers";
import Employees from "./pages/Employees";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: ("admin" | "employee")[] }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === "employee" ? "/employee-dashboard" : "/"} />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <div className="min-h-screen">
              <Navbar />
              <Routes>
                <Route path="/login" element={<Login />} />
                
                {/* Admin Routes */}
                <Route path="/" element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/customers" element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <Customers />
                  </ProtectedRoute>
                } />
                <Route path="/employees" element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <Employees />
                  </ProtectedRoute>
                } />

                {/* Employee Dashboard */}
                <Route path="/employee-dashboard" element={
                  <ProtectedRoute allowedRoles={["employee"]}>
                    <EmployeeDashboard />
                  </ProtectedRoute>
                } />

                {/* Shared Routes */}
                <Route path="/products" element={
                  <ProtectedRoute allowedRoles={["admin", "employee"]}>
                    <Products />
                  </ProtectedRoute>
                } />
                <Route path="/product/:id" element={
                  <ProtectedRoute allowedRoles={["admin", "employee"]}>
                    <ProductDetail />
                   </ProtectedRoute>
                } />
                <Route path="/shops" element={
                  <ProtectedRoute allowedRoles={["admin", "employee"]}>
                    <Shops />
                  </ProtectedRoute>
                } />
                <Route path="/shop/:id" element={
                  <ProtectedRoute allowedRoles={["admin", "employee"]}>
                    <ShopDetail />
                  </ProtectedRoute>
                } />
                <Route path="/shop/:shopId/add-product" element={
                  <ProtectedRoute allowedRoles={["admin", "employee"]}>
                    <AddProduct />
                  </ProtectedRoute>
                } />
                <Route path="/shop/:shopId/product/:productId" element={
                  <ProtectedRoute allowedRoles={["admin", "employee"]}>
                    <EditProductPrice />
                  </ProtectedRoute>
                } />
              </Routes>
            </div>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;