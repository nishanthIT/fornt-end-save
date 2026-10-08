// import { Toaster } from "@/components/ui/toaster";
// import { Toaster as Sonner } from "@/components/ui/sonner";
// import { TooltipProvider } from "@/components/ui/tooltip";
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
// import { ThemeProvider } from "@/components/ThemeProvider";
// import { AuthProvider, useAuth } from "./contexts/AuthContext";
// import { Navbar } from "./components/Navbar";
// import Login from "./pages/Login";
// import Dashboard from "./pages/Dashboard";
// import EmployeeDashboard from "./pages/EmployeeDashboard";
// import Products from "./pages/Products";
// import ProductDetail from "./pages/ProductDetail";
// import Shops from "./pages/Shops";
// import ShopDetail from "./pages/ShopDetail";
// import EditProductPrice from "./pages/EditProductPrice";
// import AddProduct from "./pages/AddProduct";
// import Customers from "./pages/Customers";
// import Employees from "./pages/Employees";

// const queryClient = new QueryClient();

// const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: ("admin" | "employee")[] }) => {
//   const { user } = useAuth();

//   if (!user) {
//     return <Navigate to="/login" />;
//   }

//   if (!allowedRoles.includes(user.userType)) {
//     return <Navigate to={user.userType === "employee" ? "/employee-dashboard" : "/"} />;
//   }

//   return <>{children}</>;
// };

// const App = () => (
//   <QueryClientProvider client={queryClient}>
//     <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
//       <AuthProvider>
//         <TooltipProvider>
//           <Toaster />
//           <Sonner />
//           <BrowserRouter>
//             <div className="min-h-screen">
//               <Navbar />
//               <Routes>
//                 <Route path="/login" element={<Login />} />
                
//                 {/* Admin Routes */}
//                 <Route path="/" element={
//                   <ProtectedRoute allowedRoles={["admin"]}>
//                     <Dashboard />
//                   </ProtectedRoute>
//                 } />
//                 <Route path="/customers" element={
//                   <ProtectedRoute allowedRoles={["admin"]}>
//                     <Customers />
//                   </ProtectedRoute>
//                 } />
//                 <Route path="/employees" element={
//                   <ProtectedRoute allowedRoles={["admin"]}>
//                     <Employees />
//                   </ProtectedRoute>
//                 } />

//                 {/* Employee Dashboard */}
//                 <Route path="/employee-dashboard" element={
//                   <ProtectedRoute allowedRoles={["employee"]}>
//                     <EmployeeDashboard />
//                   </ProtectedRoute>
//                 } />

//                 {/* Shared Routes */}
//                 <Route path="/products" element={
//                   <ProtectedRoute allowedRoles={["admin", "employee"]}>
//                     <Products />
//                   </ProtectedRoute>
//                 } />
//                 <Route path="/product/:id" element={
//                   <ProtectedRoute allowedRoles={["admin", "employee"]}>
//                     <ProductDetail />
//                    </ProtectedRoute>
//                 } />
//                 <Route path="/shops" element={
//                   <ProtectedRoute allowedRoles={["admin", "employee"]}>
//                     <Shops />
//                   </ProtectedRoute>
//                 } />
//                 <Route path="/shop/:id" element={
//                   <ProtectedRoute allowedRoles={["admin", "employee"]}>
//                     <ShopDetail />
//                   </ProtectedRoute>
//                 } />
//                 <Route path="/shop/:shopId/add-product" element={
//                   <ProtectedRoute allowedRoles={["admin", "employee"]}>
//                     <AddProduct />
//                   </ProtectedRoute>
//                 } />
//                 <Route path="/shop/:shopId/product/:productId" element={
//                   <ProtectedRoute allowedRoles={["admin", "employee"]}>
//                     <EditProductPrice />
//                   </ProtectedRoute>
//                 } />
//               </Routes>
//             </div>
//           </BrowserRouter>
//         </TooltipProvider>
//       </AuthProvider>
//     </ThemeProvider>
//   </QueryClientProvider>
// );

// export default App;

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
import Chat from "./pages/Chat";
import PriceCorrections from "./pages/PriceCorrections";
import PromotionManagement from "./pages/PromotionManagement";
import AdvertisementManagement from "./pages/AdvertisementManagement";
import NewsManagement from "./pages/NewsManagement";
import ItemsInUserList from "./pages/ItemsInUserList";
import CustomerDetails from "./pages/CustomerDetails";
import AdminListView from "./pages/AdminListView";
import type { CompanyPermission } from "./contexts/AuthContext";

const queryClient = new QueryClient();

// UX guard only: the API enforces the same company permissions on every request.
const ProtectedRoute = ({
  children,
  permission,
  adminOnly,
  staffOnly,
}: {
  children: React.ReactNode;
  permission?: CompanyPermission;
  adminOnly?: boolean;
  staffOnly?: boolean;
}) => {
  const { user, can } = useAuth();

  if (!user || !user.companyAccess) {
    return <Navigate to="/login" />;
  }

  const home = user.userType === "ADMIN" ? "/" : "/employee-dashboard";
  if (adminOnly && user.userType !== "ADMIN") return <Navigate to={home} />;
  if (staffOnly && user.userType === "ADMIN") return <Navigate to="/" />;
  if (permission && !can(permission)) return <Navigate to={home} />;

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
              <main className="pt-16">
                <Routes>
                <Route path="/login" element={<Login />} />
                
                {/* Admin Routes */}
                <Route path="/" element={
                  <ProtectedRoute adminOnly>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/customers" element={
                  <ProtectedRoute permission="customers.view">
                    <Customers />
                  </ProtectedRoute>
                } />
                <Route path="/customers/:customerId" element={
                  <ProtectedRoute permission="customers.view">
                    <CustomerDetails />
                  </ProtectedRoute>
                } />
                <Route path="/customers/:customerId/lists/:listId" element={
                  <ProtectedRoute permission="customers.view">
                    <AdminListView />
                  </ProtectedRoute>
                } />
                <Route path="/employees" element={
                  <ProtectedRoute permission="staff.manage">
                    <Employees />
                  </ProtectedRoute>
                } />
                <Route path="/items-in-user-list" element={
                  <ProtectedRoute permission="list_items.manage">
                    <ItemsInUserList />
                  </ProtectedRoute>
                } />
                <Route path="/price-corrections" element={
                  <ProtectedRoute permission="price_reports.review">
                    <PriceCorrections />
                  </ProtectedRoute>
                } />
                <Route path="/promotions" element={
                  <ProtectedRoute adminOnly>
                    <PromotionManagement />
                  </ProtectedRoute>
                } />
                <Route path="/advertisements" element={
                  <ProtectedRoute adminOnly>
                    <AdvertisementManagement />
                  </ProtectedRoute>
                } />
                <Route path="/news" element={
                  <ProtectedRoute adminOnly>
                    <NewsManagement />
                  </ProtectedRoute>
                } />

                {/* Company staff dashboard */}
                <Route path="/employee-dashboard" element={
                  <ProtectedRoute staffOnly>
                    <EmployeeDashboard />
                  </ProtectedRoute>
                } />

                {/* Catalog & wholesale shops */}
                <Route path="/products" element={
                  <ProtectedRoute permission="catalog.read">
                    <Products />
                  </ProtectedRoute>
                } />
                <Route path="/product/:id" element={
                  <ProtectedRoute permission="catalog.read">
                    <ProductDetail />
                   </ProtectedRoute>
                } />
                <Route path="/shops" element={
                  <ProtectedRoute permission="shops.manage">
                    <Shops />
                  </ProtectedRoute>
                } />
                <Route path="/shop/:id" element={
                  <ProtectedRoute permission="shops.manage">
                    <ShopDetail />
                  </ProtectedRoute>
                } />
                <Route path="/shop/:shopId/add-product" element={
                  <ProtectedRoute permission="shops.manage">
                    <AddProduct />
                  </ProtectedRoute>
                } />
                <Route path="/shop/:shopId/product/:productId" element={
                  <ProtectedRoute permission="shops.manage">
                    <EditProductPrice />
                  </ProtectedRoute>
                } />

                {/* Chat Routes */}
                <Route path="/chat" element={
                  <ProtectedRoute>
                    <Chat />
                  </ProtectedRoute>
                } />
                <Route path="/chat/:chatId" element={
                  <ProtectedRoute>
                    <Chat />
                  </ProtectedRoute>
                } />
              </Routes>
              </main>
            </div>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
