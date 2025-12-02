import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductCard } from "@/components/ProductCard";
import { Search, Barcode, Plus } from "lucide-react";
import { toast } from "sonner";

// Mock data - replace with actual API calls later
const mockProducts = [
  {
    id: 1,
    name: "Premium Wireless Headphones",
    category: "Electronics",
    price: 299.99,
    image: "/placeholder.svg",
    availability: 5,
  },
  {
    id: 2,
    name: "Smart Watch Series X",
    category: "Wearables",
    price: 399.99,
    image: "/placeholder.svg",
    availability: 3,
  },
];

const AddProduct = () => {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "",
    price: "",
  });

  const filteredProducts = mockProducts.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddExisting = (productId: number) => {
    // Here you would typically make an API call to add the product to the shop
    toast.success("Product added to shop successfully!");
    navigate(`/shop/${shopId}`);
  };

  const handleAddNew = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically make an API call to create and add the new product
    toast.success("New product created and added to shop!");
    navigate(`/shop/${shopId}`);
  };

  const handleBarcodeScan = () => {
    // Here you would implement barcode scanning functionality
    toast.info("Barcode scanning functionality coming soon!");
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Add Product to Shop</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="existing" className="space-y-4">
            <TabsList>
              <TabsTrigger value="existing">Add Existing Product</TabsTrigger>
              <TabsTrigger value="new">Add New Product</TabsTrigger>
            </TabsList>

            <TabsContent value="existing" className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="space-y-4">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    {...product}
                    onClick={() => handleAddExisting(product.id)}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="new">
              <form onSubmit={handleAddNew} className="space-y-4">
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleBarcodeScan}
                  >
                    <Barcode className="mr-2 h-4 w-4" />
                    Scan Barcode
                  </Button>
                </div>

                <div className="space-y-4">
                  <Input
                    placeholder="Product Name"
                    value={newProduct.name}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, name: e.target.value })
                    }
                  />
                  <Input
                    placeholder="Category"
                    value={newProduct.category}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, category: e.target.value })
                    }
                  />
                  <Input
                    type="number"
                    placeholder="Price"
                    value={newProduct.price}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, price: e.target.value })
                    }
                  />
                  <Button type="submit" className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Product
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddProduct;
