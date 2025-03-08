// import { useAuth } from "@/contexts/AuthContext";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Package } from "lucide-react";

// const EmployeeDashboard = () => {
//   const { user } = useAuth();

//   // Mock data - replace with actual data later
//   const todayProducts = 25;
//   const weekProducts = 150;
//   const monthProducts = 580;

//   return (
//     <div className="container py-8">
//       <h1 className="text-3xl font-bold mb-8">Welcome, {user?.name}</h1>

//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//         <Card>
//           <CardHeader>
//             <CardTitle className="text-lg">Today's Updates</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="flex items-center gap-4">
//               <div className="p-3 bg-primary/10 rounded-full">
//                 <Package className="h-6 w-6 text-primary" />
//               </div>
//               <div>
//                 <p className="text-2xl font-bold">{todayProducts}</p>
//                 <p className="text-sm text-muted-foreground">Products</p>
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader>
//             <CardTitle className="text-lg">This Week</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="flex items-center gap-4">
//               <div className="p-3 bg-primary/10 rounded-full">
//                 <Package className="h-6 w-6 text-primary" />
//               </div>
//               <div>
//                 <p className="text-2xl font-bold">{weekProducts}</p>
//                 <p className="text-sm text-muted-foreground">Products</p>
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader>
//             <CardTitle className="text-lg">This Month</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="flex items-center gap-4">
//               <div className="p-3 bg-primary/10 rounded-full">
//                 <Package className="h-6 w-6 text-primary" />
//               </div>
//               <div>
//                 <p className="text-2xl font-bold">{monthProducts}</p>
//                 <p className="text-sm text-muted-foreground">Products</p>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   );
// };

// export default EmployeeDashboard;


import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package } from "lucide-react";
import axios from "axios";

const EmployeeDashboard = () => {
  const { user } = useAuth();

  // State for statistics
  const [todayProducts, setTodayProducts] = useState(0);
  const [weekProducts, setWeekProducts] = useState(0);
  const [monthProducts, setMonthProducts] = useState(0);

  // Fetch statistics when component mounts and user is available
  useEffect(() => {
    // Only fetch data if we have a user
    if (user && user.id) {
      const fetchDashboardData = async () => {
        try {
          // Pass the user ID as a query parameter
          const response = await axios.get(`/employee/dashboard-data?employeeId=${user.id}`);

          // Update state with the fetched data
          setTodayProducts(response.data.todayCount);
          setWeekProducts(response.data.weekCount);
          setMonthProducts(response.data.monthCount);
        } catch (error) {
          console.error("Failed to fetch dashboard data:", error);
        }
      };

      fetchDashboardData();
    }
  }, [user]); // Re-run when user changes

  console.log(user)

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Welcome, {user?.name}</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Today's Updates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{todayProducts}</p>
                <p className="text-sm text-muted-foreground">Products</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{weekProducts}</p>
                <p className="text-sm text-muted-foreground">Products</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{monthProducts}</p>
                <p className="text-sm text-muted-foreground">Products</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmployeeDashboard;