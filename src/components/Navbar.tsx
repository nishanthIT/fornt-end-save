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
import { Grid, Box, Users, Store, Menu, UserCircle, LogOut, AlertTriangle, Image } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const adminNavItems = [
    { icon: Grid, label: "Dashboard", path: "/" },
    { icon: Box, label: "Products", path: "/products" },
    { icon: Store, label: "Shops", path: "/shops" },
    { icon: Users, label: "Customers", path: "/customers" },
    { icon: UserCircle, label: "Employees", path: "/employees" },
    { icon: AlertTriangle, label: "Price Corrections", path: "/price-corrections" },
    { icon: Image, label: "Promotions", path: "/promotions" },
  ];

  const employeeNavItems = [
    { icon: Grid, label: "Dashboard", path: "/employee-dashboard" },
    { icon: Box, label: "Products", path: "/products" },
    { icon: Store, label: "Shops", path: "/shops" },
    { icon: AlertTriangle, label: "Price Corrections", path: "/price-corrections" },
  ];

  const navItems = user?.userType === "ADMIN" ? adminNavItems : employeeNavItems;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const NavContent = () => (
    <div className="flex flex-col space-y-3 md:flex-row md:space-y-0 md:gap-6">
      {navItems.map((item) => (
        <Link
          key={item.label}
          to={item.path}
          className="flex items-center gap-3 px-3 py-2 text-sm font-medium navbar-responsive-text hover:bg-gray-100 rounded-md transition-colors duration-200 dark:hover:bg-gray-800 lg:hover:bg-gray-100 lg:hover:bg-opacity-20"
          onClick={() => setOpen(false)}
        >
          <item.icon className="h-5 w-5" />
          <span className="md:inline">{item.label}</span>
        </Link>
      ))}
    </div>
  );

  if (!user) return null;

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <Link 
              to={user.userType === "ADMIN" ? "/" : "/employee-dashboard"} 
              className="text-lg sm:text-xl font-bold transition-colors duration-200"
              style={{ color: '#ffffff' }}
            >
              <span className="hidden sm:inline">
                {user.userType === "ADMIN" ? "Admin Dashboard" : "Employee Dashboard"}
              </span>
              <span className="sm:hidden">
                {user.userType === "ADMIN" ? "Admin" : "Employee"}
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex lg:items-center lg:space-x-1">
            <NavContent />
          </div>

          {/* Right side buttons */}
          <div className="flex items-center space-x-2">
            {/* Logout Button - Desktop only */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleLogout}
              className="hidden lg:flex hover:bg-gray-100 hover:bg-opacity-20"
              style={{ color: '#ffffff' }}
            >
              <LogOut className="h-5 w-5" style={{ color: '#ffffff' }} />
            </Button>

            {/* Mobile Navigation */}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="text-gray-700 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 sm:w-80">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center justify-between pt-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold navbar-dark-text" style={{ color: '#000000' }}>
                      Navigation
                    </h2>
                  </div>
                  <div className="flex flex-col space-y-3">
                    {navItems.map((item) => (
                      <Link
                        key={item.label}
                        to={item.path}
                        className="flex items-center gap-3 px-3 py-2 text-sm font-medium hover:bg-gray-100 rounded-md transition-colors duration-200"
                        onClick={() => setOpen(false)}
                        style={{ color: '#000000' }}
                      >
                        <item.icon className="h-5 w-5" style={{ color: '#000000' }} />
                        <span style={{ color: '#000000' }}>{item.label}</span>
                      </Link>
                    ))}
                    
                    {/* Logout Button in Mobile Menu */}
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          handleLogout();
                          setOpen(false);
                        }}
                        className="flex items-center gap-3 px-3 py-2 text-sm font-medium hover:bg-gray-100 rounded-md transition-colors duration-200 w-full justify-start"
                        style={{ color: '#000000' }}
                      >
                        <LogOut className="h-5 w-5" style={{ color: '#000000' }} />
                        <span style={{ color: '#000000' }}>Logout</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};
