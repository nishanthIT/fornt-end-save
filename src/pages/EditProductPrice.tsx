import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Mock data - replace with actual data source later
const mockShops = [
  {
    id: 1,
    name: "Downtown Store",
    products: [
      { id: 1, name: "Product 1", price: 19.99 },
      { id: 2, name: "Product 2", price: 29.99 },
    ],
  },
  {
    id: 2,
    name: "Uptown Market",
    products: [
      { id: 3, name: "Product 3", price: 39.99 },
      { id: 4, name: "Product 4", price: 49.99 },
    ],
  },
];

const EditProductPrice = () => {
  const { shopId, productId } = useParams();
  const navigate = useNavigate();
  const [price, setPrice] = useState("");

  const shop = mockShops.find((s) => s.id === Number(shopId));
  const product = shop?.products.find((p) => p.id === Number(productId));

  const handleUpdatePrice = () => {
    // Here you would typically make an API call to update the price
    toast.success("Price updated successfully!");
    navigate(`/shop/${shopId}`);
  };

  if (!shop || !product) {
    return <div className="container mx-auto p-6">Shop or product not found</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="space-y-2">
            <span className="text-sm text-muted-foreground">Shop</span>
            <h2 className="text-xl font-semibold">{shop.name}</h2>
          </div>
          <CardTitle>Edit Product Price</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="price" className="text-sm font-medium">
                New Price (£)
              </label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Enter new price"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleUpdatePrice}>Update Price</Button>
              <Button variant="outline" onClick={() => navigate(`/shop/${shopId}`)}>
                Cancel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditProductPrice;
