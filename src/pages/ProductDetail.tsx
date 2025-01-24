import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ShopAvailability } from "@/components/ShopAvailability";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

// Mock shops data
const mockShops = [
  {
    id: 1,
    name: "Downtown Store",
    location: "123 Main St, Downtown",
    price: 299.99,
    stock: 15,
  },
  {
    id: 2,
    name: "Uptown Market",
    location: "456 High St, Uptown",
    price: 289.99,
    stock: 8,
  },
  {
    id: 3,
    name: "West Side Shop",
    location: "789 West Ave",
    price: 309.99,
    stock: 0,
  },
];

// Form schema for product editing
const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  barcode: z.string().min(1, "Barcode is required"),
  retailSize: z.string().min(1, "Retail size is required"),
  caseSize: z.string().min(1, "Case size is required"),
  image: z.string().min(1, "Image URL is required"),
});

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  // Mock product data - replace with your actual data fetching logic
  const [product, setProduct] = useState({
    id: 1,
    name: "Premium Wireless Headphones",
    category: "Electronics",
    description: "High-quality wireless headphones with noise cancellation and premium sound quality.",
    price: 299.99,
    image: "/placeholder.svg",
    barcode: "123456789",
    retailSize: "1 unit",
    caseSize: "12 units",
    specs: [
      "Active Noise Cancellation",
      "40h Battery Life",
      "Bluetooth 5.0",
    ],
  });

  const form = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product.name,
      barcode: product.barcode,
      retailSize: product.retailSize,
      caseSize: product.caseSize,
      image: product.image,
    },
  });

  const onSubmit = (values: z.infer<typeof productSchema>) => {
    // Update product data
    setProduct({
      ...product,
      ...values,
    });
    
    toast({
      title: "Success",
      description: "Product details updated successfully",
    });
    
    setIsEditing(false);
  };

  return (
    <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Products
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="relative h-96">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover rounded-lg shadow-lg"
            />
          </div>

          <div className="space-y-4">
            <Badge>{product.category}</Badge>
            <div className="flex justify-between items-center">
              <h1 className="text-4xl font-bold">{product.name}</h1>
              <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogTrigger asChild>
                  <Button>Edit Product</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Edit Product Details</DialogTitle>
                    <DialogDescription>
                      Make changes to the product details here.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Product Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="barcode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Barcode</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="retailSize"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Retail Size</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="caseSize"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Case Size</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="image"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Image URL</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full">Save Changes</Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
            <p className="text-muted-foreground">{product.description}</p>
            
            <div className="space-y-2">
              <h3 className="font-semibold">Product Details:</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Barcode</p>
                  <p className="font-medium">{product.barcode}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Retail Size</p>
                  <p className="font-medium">{product.retailSize}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Case Size</p>
                  <p className="font-medium">{product.caseSize}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold">Specifications:</h3>
              <ul className="list-disc list-inside space-y-1">
                {product.specs.map((spec, index) => (
                  <li key={index} className="text-muted-foreground">{spec}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-semibold mb-4">Available at Stores</h2>
          <div className="space-y-4">
            {mockShops.map((shop) => (
              <ShopAvailability key={shop.id} shop={shop} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;