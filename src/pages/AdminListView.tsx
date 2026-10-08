import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { API_CONFIG, getAdminUrl } from "@/config/api";

interface AdminList {
  id: string;
  name: string;
  description: string;
  creatorType: string;
  createdAt: string;
  shop: { id: string; name: string } | null;
  createdBy: { id: number; name: string; email: string } | null;
  items: {
    id: string;
    title: string;
    barcode: string | null;
    quantity: number;
    isPurchased: boolean;
    isUrgent: boolean;
    price: string | null;
    shopName: string | null;
  }[];
}

/** Read-only view of a customer's shop list for company admins. */
const AdminListView = () => {
  const { customerId, listId } = useParams();
  const [list, setList] = useState<AdminList | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(getAdminUrl(API_CONFIG.ADMIN.LIST(listId as string)), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }).catch(() => null);
      const body = await response?.json().catch(() => null);
      if (!response?.ok || !body?.success) {
        setError(body?.error || "Failed to load list");
        return;
      }
      setList(body.data);
    };
    load();
  }, [listId]);

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-4">
      <Button variant="ghost" size="sm" asChild>
        <Link to={`/customers/${customerId}`}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Customer details
        </Link>
      </Button>
      {error && <p className="text-red-600">{error}</p>}
      {list && (
        <Card>
          <CardHeader>
            <CardTitle>{list.name}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {list.shop?.name ?? "No shop"} · created by {list.createdBy?.name ?? "unknown"} (
              {list.creatorType === "EMPLOYEE" ? "shop employee" : list.creatorType.toLowerCase()}) ·{" "}
              {format(new Date(list.createdAt), "MMM dd, yyyy")}
            </p>
          </CardHeader>
          <CardContent>
            {list.items.length === 0 ? (
              <p className="text-muted-foreground">This list is empty.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Barcode</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Supplier shop</TableHead>
                    <TableHead>State</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.title}</TableCell>
                      <TableCell>{item.barcode ?? "—"}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.price != null ? `£${Number(item.price).toFixed(2)}` : "—"}</TableCell>
                      <TableCell>{item.shopName ?? "—"}</TableCell>
                      <TableCell className="space-x-1">
                        {item.isPurchased && <Badge variant="secondary">purchased</Badge>}
                        {item.isUrgent && <Badge variant="destructive">urgent</Badge>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminListView;
