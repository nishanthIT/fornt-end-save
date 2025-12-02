import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Edit, User, Plus, Trash2, Clock, Calendar, TrendingUp, Info } from "lucide-react";
import { toast } from "sonner";
import SubscriptionInfoCard from "@/components/SubscriptionInfoCard";
import { API_CONFIG, getAdminUrl, getAuthUrl } from "@/config/api";

interface SubscriptionDetails {
  status: string;
  daysRemaining: number | string;
  isExpired: boolean;
  trialStartDate?: string;
  trialEndDate?: string;
  statusColor?: string;
}

interface Customer {
  id: number;
  name: string;
  email: string;
  mobile: string;
  subscriptionStatus: string;
  trialStartDate: string;
  trialEndDate: string;
  earnings: string;
  userType: string;
  lists: { id: string; name: string }[];
  subscriptionDetails: SubscriptionDetails;
  totalLists: number;
  formattedEarnings: string;
}

interface ApiResponse {
  success: boolean;
  data: {
    customers: Customer[];
    totalCount: number;
    subscriptionStats: {
      totalCustomers: number;
      activeTrials: number;
      expiredTrials: number;
      expiringSoon: number;
      totalLists: number;
      totalEarnings: string;
    };
  };
}

const Customers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [showSubscriptionInfo, setShowSubscriptionInfo] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);

  const fetchCustomers = async () => {
    try {
      const response = await fetch(getAdminUrl(API_CONFIG.ADMIN.CUSTOMERS));
      const data: ApiResponse = await response.json();
      
      if (data.success) {
        setCustomers(data.data.customers);
        setStats(data.data.subscriptionStats);
      } else {
        toast.error('Failed to fetch customers');
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (editingCustomer) {
      // For now, just update locally since we don't have an update API endpoint
      // In a real app, you'd call an API here
      setCustomers(customers.map(c => 
        c.id === editingCustomer.id ? editingCustomer : c
      ));
      toast.success("Customer details updated successfully!");
      setIsEditing(false);
    }
  };

  const handleDelete = (id: number) => {
    setCustomers(customers.filter(c => c.id !== id));
    toast.success("Customer deleted successfully!");
  };

  const handleUpgradeCustomer = async (customerId: number) => {
    try {
      const response = await fetch(getAdminUrl(API_CONFIG.ADMIN.CUSTOMER_SUBSCRIPTION(customerId)), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionStatus: 'premium',
          subscriptionEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
        }),
      });

      if (response.ok) {
        await fetchCustomers(); // Refresh the list
        toast.success('Customer upgraded to premium successfully!');
      } else {
        toast.error('Failed to upgrade customer');
      }
    } catch (error) {
      console.error('Error upgrading customer:', error);
      toast.error('Failed to upgrade customer');
    }
  };

  const handleExtendTrial = async (customerId: number) => {
    try {
      const response = await fetch(getAdminUrl(API_CONFIG.ADMIN.CUSTOMER_SUBSCRIPTION(customerId)), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionStatus: 'free_trial',
          subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 more days
        }),
      });

      if (response.ok) {
        await fetchCustomers(); // Refresh the list
        toast.success('Trial extended by 30 days!');
      } else {
        toast.error('Failed to extend trial');
      }
    } catch (error) {
      console.error('Error extending trial:', error);
      toast.error('Failed to extend trial');
    }
  };

  const processExpiredTrials = async () => {
    try {
      const response = await fetch(getAdminUrl(API_CONFIG.ADMIN.PROCESS_EXPIRED_TRIALS), {
        method: 'POST',
      });

      const data = await response.json();
      
      if (response.ok) {
        await fetchCustomers(); // Refresh the list
        toast.success(`Processed ${data.data.expiredCount} expired trials`);
      } else {
        toast.error('Failed to process expired trials');
      }
    } catch (error) {
      console.error('Error processing expired trials:', error);
      toast.error('Failed to process expired trials');
    }
  };

  const handleAddCustomer = async () => {
    if (!newCustomer.name || !newCustomer.email || !newCustomer.password) {
      toast.error("Please fill in all required fields!");
      return;
    }

    try {
      const response = await fetch(getAuthUrl(API_CONFIG.AUTH.REGISTER), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCustomer.name,
          email: newCustomer.email,
          password: newCustomer.password,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        // Refresh the customer list
        await fetchCustomers();
        setNewCustomer({ name: "", email: "", password: "" });
        setIsAddingCustomer(false);
        toast.success("Customer added successfully with free trial!");
      } else {
        toast.error(data.error || "Failed to add customer");
      }
    } catch (error) {
      console.error('Error adding customer:', error);
      toast.error("Failed to add customer");
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading customers...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Customer Management</h1>
          <p className="text-gray-600">Manage your customers and their subscriptions</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsAddingCustomer(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Customer
          </Button>
          <Button 
            variant="outline" 
            onClick={processExpiredTrials}
            className="text-orange-600 border-orange-600 hover:bg-orange-50"
          >
            <Clock className="mr-2 h-4 w-4" /> Process Expired Trials
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowSubscriptionInfo(!showSubscriptionInfo)}
            className="text-blue-600 border-blue-600 hover:bg-blue-50"
          >
            <Info className="mr-2 h-4 w-4" /> 
            {showSubscriptionInfo ? 'Hide' : 'Show'} Subscription Info
          </Button>
        </div>
      </div>

      {/* Subscription Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <User className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Total Customers</p>
                  <p className="text-2xl font-bold">{stats.totalCustomers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Active Trials</p>
                  <p className="text-2xl font-bold text-green-600">{stats.activeTrials}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="text-sm text-gray-600">Expiring Soon</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.expiringSoon}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-8 w-8 text-red-500" />
                <div>
                  <p className="text-sm text-gray-600">Expired Trials</p>
                  <p className="text-2xl font-bold text-red-600">{stats.expiredTrials}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Subscription Information Card */}
      {showSubscriptionInfo && (
        <div className="mb-6">
          <SubscriptionInfoCard />
        </div>
      )}

      <div className="space-y-4">
        {customers.map((customer) => (
          <Card key={customer.id} className="w-full">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <User className="h-10 w-10 text-gray-400" />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{customer.name}</h3>
                      <Badge 
                        variant={customer.subscriptionDetails.isExpired ? "destructive" : "default"}
                        style={{ backgroundColor: customer.subscriptionDetails.statusColor }}
                      >
                        {customer.subscriptionDetails.status || 'Unknown'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <p className="font-medium">Contact Info</p>
                        <p>{customer.email}</p>
                      </div>
                      <div>
                        <p className="font-medium">Subscription Details</p>
                        {customer.subscriptionDetails.daysRemaining !== 'Unknown' && (
                          <p>Days remaining: <span className="font-semibold">{customer.subscriptionDetails.daysRemaining}</span></p>
                        )}
                        {customer.subscriptionDetails.trialEndDate && (
                          <p>Trial ends: {customer.subscriptionDetails.trialEndDate}</p>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">Activity</p>
                        <p>Lists created: <span className="font-semibold">{customer.totalLists}</span></p>
                        <p>Earnings: <span className="font-semibold text-green-600">{customer.formattedEarnings}</span></p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(customer)}
                    title="Edit customer details"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  {customer.subscriptionDetails.isExpired && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpgradeCustomer(customer.id)}
                      className="text-green-600 border-green-600 hover:bg-green-50"
                    >
                      Upgrade
                    </Button>
                  )}
                  {customer.subscriptionDetails.status === 'Free Trial Active' && 
                   customer.subscriptionDetails.daysRemaining !== 'Unknown' && 
                   customer.subscriptionDetails.daysRemaining <= 7 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExtendTrial(customer.id)}
                      className="text-orange-600 border-orange-600 hover:bg-orange-50"
                    >
                      Extend Trial
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(customer.id)}
                    title="Delete customer"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Customer Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Customer Details</DialogTitle>
          </DialogHeader>
          {editingCustomer && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={editingCustomer.name}
                  onChange={(e) =>
                    setEditingCustomer({
                      ...editingCustomer,
                      name: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  value={editingCustomer.email}
                  onChange={(e) =>
                    setEditingCustomer({
                      ...editingCustomer,
                      email: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Subscription Status</label>
                <div className="p-2 bg-gray-50 rounded">
                  <p className="text-sm">
                    <span className="font-medium">Status:</span> {editingCustomer.subscriptionDetails.status}
                  </p>
                  {editingCustomer.subscriptionDetails.daysRemaining !== 'Unknown' && (
                    <p className="text-sm">
                      <span className="font-medium">Days Remaining:</span> {editingCustomer.subscriptionDetails.daysRemaining}
                    </p>
                  )}
                  <p className="text-sm">
                    <span className="font-medium">Earnings:</span> {editingCustomer.formattedEarnings}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Total Lists:</span> {editingCustomer.totalLists}
                  </p>
                </div>
              </div>
              <Button onClick={handleSave} className="w-full">
                Save Changes
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Customer Dialog */}
      <Dialog open={isAddingCustomer} onOpenChange={setIsAddingCustomer}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={newCustomer.name}
                onChange={(e) =>
                  setNewCustomer({
                    ...newCustomer,
                    name: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                value={newCustomer.email}
                onChange={(e) =>
                  setNewCustomer({
                    ...newCustomer,
                    email: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <Input
                type="password"
                value={newCustomer.password || ''}
                onChange={(e) =>
                  setNewCustomer({
                    ...newCustomer,
                    password: e.target.value,
                  })
                }
                placeholder="Enter password for new customer"
              />
            </div>
            <Button onClick={handleAddCustomer} className="w-full">
              Add Customer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Customers;
