// import { useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
// import { Button } from "@/components/ui/button";
// import { Grid, Box, Users, Store, Menu, Sun, Moon, UserCircle, LogOut } from "lucide-react";
// import { useTheme } from "@/components/ThemeProvider";
// import { useAuth } from "@/contexts/AuthContext";

// export const Navbar = () => {
//   const [open, setOpen] = useState(false);
//   const { theme, setTheme } = useTheme();
//   const { user, logout } = useAuth();
//   const navigate = useNavigate();

//   const adminNavItems = [
//     { icon: Grid, label: "Dashboard", path: "/" },
//     { icon: Box, label: "Products", path: "/products" },
//     { icon: Store, label: "Shops", path: "/shops" },
//     { icon: Users, label: "Customers", path: "/customers" },
//     { icon: UserCircle, label: "Employees", path: "/employees" },
//   ];

//   const employeeNavItems = [
//     { icon: Grid, label: "Dashboard", path: "/employee-dashboard" },
//     { icon: Box, label: "Products", path: "/products" },
//     { icon: Store, label: "Shops", path: "/shops" },
//   ];

//   const navItems = user?.role === "admin" ? adminNavItems : employeeNavItems;

//   const handleLogout = () => {
//     logout();
//     navigate("/login");
//   };

//   const NavContent = () => (
//     <div className="flex flex-col md:flex-row gap-4">
//       {navItems.map((item) => (
//         <Link
//           key={item.label}
//           to={item.path}
//           className="flex items-center gap-2 text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
//           onClick={() => setOpen(false)}
//         >
//           <item.icon className="h-5 w-5" />
//           <span>{item.label}</span>
//         </Link>
//       ))}
//     </div>
//   );

//   if (!user) return null;

//   return (
//     <nav className="border-b dark:border-gray-800">
//       <div className="container mx-auto px-4 h-16 flex items-center justify-between">
//         <Link to={user.role === "admin" ? "/" : "/employee-dashboard"} className="text-xl font-bold">
//           {user.role === "admin" ? "Admin Dashboard" : "Employee Dashboard"}
//         </Link>

//         <div className="flex items-center gap-4">
//           {/* Desktop Navigation */}
//           <div className="hidden md:flex gap-6">
//             <NavContent />
//           </div>

//           {/* Theme Toggle */}
//           <Button
//             variant="ghost"
//             size="icon"
//             onClick={() => setTheme(theme === "light" ? "dark" : "light")}
//           >
//             {theme === "light" ? (
//               <Moon className="h-5 w-5" />
//             ) : (
//               <Sun className="h-5 w-5" />
//             )}
//           </Button>

//           {/* Logout Button */}
//           <Button variant="ghost" size="icon" onClick={handleLogout}>
//             <LogOut className="h-5 w-5" />
//           </Button>

//           {/* Mobile Navigation */}
//           <Sheet open={open} onOpenChange={setOpen}>
//             <SheetTrigger asChild className="md:hidden">
//               <Button variant="ghost" size="icon">
//                 <Menu className="h-6 w-6" />
//               </Button>
//             </SheetTrigger>
//             <SheetContent>
//               <div className="mt-6">
//                 <NavContent />
//               </div>
//             </SheetContent>
//           </Sheet>
//         </div>
//       </div>
//     </nav>
//   );
// };

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Grid, Box, Users, Store, Menu, UserCircle, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Debug log to see the user object
  console.log("Navbar user:", user);

  const adminNavItems = [
    { icon: Grid, label: "Dashboard", path: "/" },
    { icon: Box, label: "Products", path: "/products" },
    { icon: Store, label: "Shops", path: "/shops" },
    { icon: Users, label: "Customers", path: "/customers" },
    { icon: UserCircle, label: "Employees", path: "/employees" },
  ];

  const employeeNavItems = [
    { icon: Grid, label: "Dashboard", path: "/employee-dashboard" },
    { icon: Box, label: "Products", path: "/products" },
    { icon: Store, label: "Shops", path: "/shops" },
  ];

  // Fix: Check userType instead of role - use lowercase 'admin' to match how your component is checking
  const navItems = user?.userType === "ADMIN" ? adminNavItems : employeeNavItems;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const NavContent = () => (
    <div className="flex flex-col md:flex-row gap-4">
      {navItems.map((item) => (
        <Link
          key={item.label}
          to={item.path}
          className="flex items-center gap-2 text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
          onClick={() => setOpen(false)}
        >
          <item.icon className="h-5 w-5" />
          <span>{item.label}</span>
        </Link>
      ))}
    </div>
  );

  if (!user) return null;

  return (
    <nav className="border-b dark:border-gray-800">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Fix: Use userType instead of role */}
        <Link to={user.userType === "ADMIN" ? "/" : "/employee-dashboard"} className="text-xl font-bold">
          {user.userType === "ADMIN" ? "Admin Dashboard" : "Employee Dashboard"}
        </Link>

        <div className="flex items-center gap-4">
          {/* Desktop Navigation */}
          <div className="hidden md:flex gap-6">
            <NavContent />
          </div>

          {/* Logout Button */}
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>

          {/* Mobile Navigation */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <div className="mt-6">
                <NavContent />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};