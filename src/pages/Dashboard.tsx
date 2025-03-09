// import { Card } from "@/components/ui/card";
// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
// import { Users, Package, Store } from "lucide-react";

// const mockEarningsData = [
//   { month: 'Jan', earnings: 4000 },
//   { month: 'Feb', earnings: 3000 },
//   { month: 'Mar', earnings: 5000 },
//   { month: 'Apr', earnings: 2780 },
//   { month: 'May', earnings: 4890 },
// ];

// const mockStats = [
//   { label: 'Total Customers', value: '1,234', icon: Users },
//   { label: 'Total Products', value: '567', icon: Package },
//   { label: 'Total Shops', value: '89', icon: Store },
// ];

// const Dashboard = () => {
//   return (
//     <div className="container py-8">
//       <h1 className="text-3xl font-bold mb-8">Dashboard Overview</h1>
      
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
//         {mockStats.map((stat) => (
//           <Card key={stat.label} className="p-6">
//             <div className="flex items-center gap-4">
//               <div className="p-3 bg-primary/10 rounded-full">
//                 <stat.icon className="h-6 w-6 text-primary" />
//               </div>
//               <div>
//                 <p className="text-sm text-muted-foreground">{stat.label}</p>
//                 <p className="text-2xl font-bold">{stat.value}</p>
//               </div>
//             </div>
//           </Card>
//         ))}
//       </div>

//       <Card className="p-6">
//         <h2 className="text-xl font-semibold mb-4">Monthly Earnings</h2>
//         <div className="h-[300px]">
//           <ResponsiveContainer width="100%" height="100%">
//             <BarChart data={mockEarningsData}>
//               <CartesianGrid strokeDasharray="3 3" />
//               <XAxis dataKey="month" />
//               <YAxis />
//               <Tooltip />
//               <Bar dataKey="earnings" fill="#3b82f6" />
//             </BarChart>
//           </ResponsiveContainer>
//         </div>
//       </Card>
//     </div>
//   );
// };

// export default Dashboard;


import { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Package, Store } from "lucide-react";
import api from '@/utils/axiosInstance';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    stats: [
      { label: 'Total Customers', value: '0', icon: Users },
      { label: 'Total Products', value: '0', icon: Package },
      { label: 'Total Shops', value: '0', icon: Store },
    ],
    earningsData: []
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
       // const response = await fetch('https://backend.h7tex.com/api/admin/dashboard/overview');
       
        const result = await api.get('/admin/dashboard/overview');
        
        if (result.data.success) {
          // Add icons to stats data
          
        
          const statsWithIcons = result.data.data.stats.map(stat => {
            let icon = Users;
            if (stat.label === 'Total Products') icon = Package;
            if (stat.label === 'Total Shops') icon = Store;
            
            return {
              ...stat,
              icon,
              // Format numbers with commas
              value: parseInt(stat.value).toLocaleString()
            };
          });
          
          setDashboardData({
            stats: statsWithIcons,
            earningsData: result.data.data.earningsData
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {dashboardData.stats.map((stat) => (
          <Card key={stat.label} className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <stat.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Monthly Earnings</h2>
        <div className="h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p>Loading chart data...</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboardData.earningsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="earnings" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;