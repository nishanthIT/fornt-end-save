// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { useAuth } from "@/contexts/AuthContext";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { toast } from "sonner";

// const Login = () => {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const { login } = useAuth();
//   const navigate = useNavigate();

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     login(email, password);
//     if (email === "admin@example.com" && password === "admin123") {
//       toast.success("Welcome back, Admin!");
//       navigate("/");
//     } else if (email === "employee@example.com" && password === "emp123") {
//       toast.success("Welcome back!");
//       navigate("/employee-dashboard");
//     } else {
//       toast.error("Invalid credentials");
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center">
//       <Card className="w-[400px]">
//         <CardHeader>
//           <CardTitle>Login</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <form onSubmit={handleSubmit} className="space-y-4">
//             <div className="space-y-2">
//               <Input
//                 type="email"
//                 placeholder="Email"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//               />
//             </div>
//             <div className="space-y-2">
//               <Input
//                 type="password"
//                 placeholder="Password"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//               />
//             </div>
//             <Button type="submit" className="w-full">
//               Login
//             </Button>
//           </form>
//         </CardContent>
//       </Card>
//     </div>
//   );
// };

// export default Login;




// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { useAuth } from "@/contexts/AuthContext";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { toast } from "sonner";

// const Login = () => {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [userType, setUserType] = useState<"ADMIN" | "EMPLOYEE" | "CUSTOMER">("ADMIN");
//   const [loading, setLoading] = useState(false);
//   const { login } = useAuth();
//   const navigate = useNavigate();

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);
    
//     try {
//       await login(email, password, userType);
      
//       // Different redirects based on user type
//       if (userType === "ADMIN") {
//         toast.success("Welcome back, Admin!");
//         navigate("/");
//       } else if (userType === "EMPLOYEE") {
//         toast.success("Welcome back!");
//         navigate("/employee-dashboard");
//       } else {
//         toast.success("Welcome back!");
//         navigate("/customer-dashboard");
//       }
//     } catch (error) {
//       toast.error("Invalid credentials");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center">
//       <Card className="w-[400px]">
//         <CardHeader>
//           <CardTitle>Login</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <form onSubmit={handleSubmit} className="space-y-4">
//             <div className="space-y-2">
//               <Select
//                 value={userType}
//                 onValueChange={(value) => setUserType(value as "ADMIN" | "EMPLOYEE" | "CUSTOMER")}
//               >
//                 <SelectTrigger>
//                   <SelectValue placeholder="Select user type" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="ADMIN">Admin</SelectItem>
//                   <SelectItem value="EMPLOYEE">Employee</SelectItem>
//                   <SelectItem value="CUSTOMER">Customer</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>
//             <div className="space-y-2">
//               <Input
//                 type="email"
//                 placeholder="Email"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 required
//               />
//             </div>
//             <div className="space-y-2">
//               <Input
//                 type="password"
//                 placeholder="Password"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 required
//               />
//             </div>
//             <Button type="submit" className="w-full" disabled={loading}>
//               {loading ? "Logging in..." : "Login"}
//             </Button>
//           </form>
//         </CardContent>
//       </Card>
//     </div>
//   );
// };

// export default Login;







// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { useAuth } from "../contexts/AuthContext";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { toast } from "@/components/ui/use-toast";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardFooter,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";

// const Login = () => {
//   const { login, user } = useAuth();
//   const navigate = useNavigate();
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [userType, setUserType] = useState<"ADMIN" | "EMPLOYEE" | "CUSTOMER">("ADMIN");
//   const [isLoading, setIsLoading] = useState(false);

//   // Redirect if already logged in
//   if (user) {
//     console.log(user)
//     // Added debug logging to see what's happening
//     console.log("User already logged in, userType:", user.userType);
//     if (user.userType === "ADMIN") {
//       navigate("/");
//     } else if (user.userType === "EMPLOYEE") {
//       navigate("/employee-dashboard");
//     }
//   }

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsLoading(true);
    
//     try {
//       await login(email, password, userType);
      
//       // Added debug logging to see where we're redirecting
//       console.log(`Login successful as ${userType}, redirecting...`);
      
//       // Handle redirect based on user type
//       if (userType === "ADMIN") {
//         navigate("/");
//       } else if (userType === "EMPLOYEE") {
//         navigate("/employee-dashboard");
//       }
      
//       toast({
//         title: "Login Successful",
//         description: `Welcome back!`,
//       });
//     } catch (error) {
//       console.error("Login error:", error);
//       toast({
//         title: "Login Failed",
//         description: "Invalid credentials. Please try again.",
//         variant: "destructive",
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="flex items-center justify-center min-h-[80vh]">
//       <Card className="w-full max-w-md">
//         <CardHeader>
//           <CardTitle className="text-2xl">Login</CardTitle>
//           <CardDescription>
//             Enter your credentials to access your account
//           </CardDescription>
//         </CardHeader>
//         <form onSubmit={handleSubmit}>
//           <CardContent className="space-y-4">
//             <div className="space-y-2">
//               <Label htmlFor="email">Email</Label>
//               <Input
//                 id="email"
//                 type="email"
//                 placeholder="Enter your email"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 required
//               />
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="password">Password</Label>
//               <Input
//                 id="password"
//                 type="password"
//                 placeholder="Enter your password"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 required
//               />
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="userType">User Type</Label>
//               <Select 
//                 value={userType} 
//                 onValueChange={(value) => setUserType(value as "ADMIN" | "EMPLOYEE" | "CUSTOMER")}
//               >
//                 <SelectTrigger>
//                   <SelectValue placeholder="Select user type" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="ADMIN">Admin</SelectItem>
//                   <SelectItem value="EMPLOYEE">Employee</SelectItem>
//                   <SelectItem value="CUSTOMER">Customer</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>
//           </CardContent>
//           <CardFooter>
//             <Button type="submit" className="w-full" disabled={isLoading}>
//               {isLoading ? "Logging in..." : "Login"}
//             </Button>
//           </CardFooter>
//         </form>
//       </Card>
//     </div>
//   );
// };

// export default Login;




import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Login = () => {
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState<"ADMIN" | "EMPLOYEE" | "CUSTOMER">("ADMIN");
  const [isLoading, setIsLoading] = useState(false);
  
  // Handle redirection based on user type
  const redirectUser = (userType: string) => {
    if (userType === "ADMIN") {
      navigate("/");
    } else if (userType === "EMPLOYEE") {
      navigate("/employee-dashboard");
    } else if (userType === "CUSTOMER") {
      navigate("/");
    }
  };

  // Use useEffect for redirection to prevent the component from rendering at all
  useEffect(() => {
    if (user && !loading) {
      console.log("User already logged in:", user);
      redirectUser(user.userType);
    }
  }, [user, loading, navigate]);

  // If still loading auth state or user is already logged in, don't render the form
  if (loading || user) {
    return null; // Return nothing to prevent the login page flash
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await login(email, password, userType);
      
      console.log(`Login successful as ${userType}, redirecting...`);
      
      toast({
        title: "Login Successful",
        description: `Welcome back!`,
      });
      
      // No need to navigate here - the useEffect will handle it
      // when the user state updates
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="userType">User Type</Label>
              <Select 
                value={userType} 
                onValueChange={(value) => setUserType(value as "ADMIN" | "EMPLOYEE" | "CUSTOMER")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select user type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="EMPLOYEE">Employee</SelectItem>
                  <SelectItem value="CUSTOMER">Customer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Login;