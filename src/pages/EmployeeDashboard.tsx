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
import { Package, ListTree } from "lucide-react";
import axios from "axios";

const EmployeeDashboard = () => {
  const { user } = useAuth();

  // State for statistics
  const [todayProducts, setTodayProducts] = useState(0);
  const [weekProducts, setWeekProducts] = useState(0);
  const [monthProducts, setMonthProducts] = useState(0);
  const [listUpdates, setListUpdates] = useState({
    today: 0,
    week: 0,
    month: 0,
    total: 0
  });
  const [listItemHistory, setListItemHistory] = useState<Array<{
    id: string;
    timestamp: string;
    product: {
      id: string;
      title: string;
      barcode: string | null;
      caseBarcode: string | null;
    };
    shop: {
      id: string;
      name: string;
    };
  }>>([]);

  // Fetch statistics when component mounts and user is available
  useEffect(() => {
    // Only fetch data if we have a user
    if (user && user.id) {
      const fetchDashboardData = async () => {
        try {
          // Pass the user ID as a query parameter
          const response = await axios.get(`/employee/dashboard-data?employeeId=${user.id}`);
          const updatesResponse = await axios.get('/employee/list-item-updates?limit=10');

          // Update state with the fetched data
          setTodayProducts(response.data.todayCount);
          setWeekProducts(response.data.weekCount);
          setMonthProducts(response.data.monthCount);
          const listItemUpdates = response.data.listItemUpdates || {};
          setListUpdates({
            today: listItemUpdates.today || 0,
            week: listItemUpdates.week || 0,
            month: listItemUpdates.month || 0,
            total: listItemUpdates.total || 0
          });
          setListItemHistory(updatesResponse.data?.data || []);
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

      <div className="mt-10">
        <div className="flex flex-col gap-1 mb-5">
          <h2 className="text-2xl font-semibold">Items in User List Updates</h2>
          <p className="text-sm text-muted-foreground">Total updates: {listUpdates.total}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Today's Updates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <ListTree className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{listUpdates.today}</p>
                  <p className="text-sm text-muted-foreground">Items Updated</p>
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
                  <ListTree className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{listUpdates.week}</p>
                  <p className="text-sm text-muted-foreground">Items Updated</p>
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
                  <ListTree className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{listUpdates.month}</p>
                  <p className="text-sm text-muted-foreground">Items Updated</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">Recent Updates</h3>
          {listItemHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent updates found.</p>
          ) : (
            <div className="space-y-2">
              {listItemHistory.map((entry) => (
                <Card key={entry.id}>
                  <CardContent className="p-3">
                    <div className="flex flex-col gap-1">
                      <div className="text-sm font-semibold">{entry.product?.title || 'Unnamed Item'}</div>
                      <div className="text-xs text-muted-foreground">
                        {entry.product?.barcode || entry.product?.caseBarcode || 'No barcode'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {entry.shop?.name || 'Unknown shop'} · {new Date(entry.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
