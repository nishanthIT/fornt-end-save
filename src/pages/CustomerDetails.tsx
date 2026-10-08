import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { API_CONFIG, getAdminUrl } from "@/config/api";
import { shopAccessSummary } from "@/config/permissions";

type MembershipStatus = "ACTIVE" | "INACTIVE" | "INVITED" | "REMOVED";

interface ShopEmployee {
  id: number;
  membershipId: string;
  name: string;
  email: string;
  shopId: string;
  shopName: string;
  role: string;
  permissions: string[];
  status: MembershipStatus;
  createdAt: string;
  lastActiveAt: string | null;
  lists: { id: string; name: string; createdAt: string; itemCount: number }[];
}

type Counts = Record<MembershipStatus, number> & { total: number };

interface ShopGroup {
  shop: { id: string; name: string; shopType: string };
  counts: Counts;
  employees: ShopEmployee[];
}

interface CustomerEmployeesResponse {
  customer: { id: number; name: string; email: string };
  shops: ShopGroup[];
  counts: Counts;
}

const STATUSES: MembershipStatus[] = ["ACTIVE", "INACTIVE", "INVITED", "REMOVED"];

const statusVariant = (status: MembershipStatus) =>
  status === "ACTIVE" ? "default" : status === "INVITED" ? "secondary" : status === "INACTIVE" ? "outline" : "destructive";

const formatDate = (value: string | null) => (value ? format(new Date(value), "MMM dd, yyyy HH:mm") : "—");

/**
 * Customers → Customer details. The Employees tab lists this customer's Shop Employees
 * (read-only). Viewing them never grants company access.
 */
const CustomerDetails = () => {
  const { customerId } = useParams();
  const [data, setData] = useState<CustomerEmployeesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [shopFilter, setShopFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | MembershipStatus>("ALL");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("auth_token");
        const response = await fetch(getAdminUrl(API_CONFIG.ADMIN.CUSTOMER_EMPLOYEES(customerId as string)), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const body = await response.json().catch(() => null);
        if (!response.ok || !body?.success) {
          setError(body?.error || "Failed to load customer employees");
          return;
        }
        setData(body.data);
      } catch {
        setError("Failed to load customer employees");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [customerId]);

  const visibleShops = useMemo(() => {
    if (!data) return [];
    return data.shops
      .filter((group) => shopFilter === "ALL" || group.shop.id === shopFilter)
      .map((group) => ({
        ...group,
        employees: group.employees.filter((e) => statusFilter === "ALL" || e.status === statusFilter),
      }));
  }, [data, shopFilter, statusFilter]);

  if (loading) return <div className="max-w-7xl mx-auto p-6">Loading customer...</div>;
  if (error || !data) return <div className="max-w-7xl mx-auto p-6 text-red-600">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/customers">
            <ArrowLeft className="h-4 w-4 mr-1" /> Customers
          </Link>
        </Button>
      </div>
      <div>
        <h1 className="text-2xl font-bold">{data.customer.name}</h1>
        <p className="text-muted-foreground">{data.customer.email}</p>
      </div>

      <Tabs defaultValue="employees">
        <TabsList>
          <TabsTrigger value="employees">Employees</TabsTrigger>
        </TabsList>
        <TabsContent value="employees" className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Shop Employees created by this customer for their shop. They are not Company Staff and have no access to
            this dashboard.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{data.counts.total}</p>
              </CardContent>
            </Card>
            {STATUSES.map((status) => (
              <Card key={status}>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground capitalize">{status.toLowerCase()}</p>
                  <p className="text-2xl font-bold">{data.counts[status]}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            {data.shops.length > 1 && (
              <Select value={shopFilter} onValueChange={setShopFilter}>
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="All shops" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All shops</SelectItem>
                  {data.shops.map((group) => (
                    <SelectItem key={group.shop.id} value={group.shop.id}>
                      {group.shop.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as "ALL" | MembershipStatus)}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                {STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.charAt(0) + status.slice(1).toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {visibleShops.length === 0 && <p className="text-muted-foreground">This customer does not own a shop.</p>}

          {visibleShops.map((group) => (
            <Card key={group.shop.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Store className="h-5 w-5" /> {group.shop.name}
                  <span className="text-sm font-normal text-muted-foreground">
                    · {group.counts.total} employees ({group.counts.ACTIVE} active)
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                {group.employees.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No shop employees match these filters.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Shop</TableHead>
                        <TableHead>Access</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Last activity</TableHead>
                        <TableHead>Lists</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.employees.map((employee) => (
                        <TableRow key={employee.membershipId}>
                          <TableCell className="font-medium">{employee.name}</TableCell>
                          <TableCell>{employee.email}</TableCell>
                          <TableCell>{employee.shopName}</TableCell>
                          <TableCell>
                            {shopAccessSummary(employee.permissions).length === 0 ? (
                              <span className="text-muted-foreground">No tools</span>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {shopAccessSummary(employee.permissions).map((label) => (
                                  <Badge key={label} variant="secondary">{label}</Badge>
                                ))}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusVariant(employee.status)}>{employee.status.toLowerCase()}</Badge>
                          </TableCell>
                          <TableCell>{formatDate(employee.createdAt)}</TableCell>
                          <TableCell>{formatDate(employee.lastActiveAt)}</TableCell>
                          <TableCell>
                            {employee.lists.length === 0 ? (
                              <span className="text-muted-foreground">0</span>
                            ) : (
                              <ul className="space-y-1">
                                {employee.lists.map((list) => (
                                  <li key={list.id}>
                                    <Link
                                      className="text-blue-600 hover:underline"
                                      to={`/customers/${data.customer.id}/lists/${list.id}`}
                                    >
                                      {list.name}
                                    </Link>
                                    <span className="text-xs text-muted-foreground"> · {list.itemCount} items</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CustomerDetails;
