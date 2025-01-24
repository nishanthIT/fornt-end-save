// import { useState } from "react";
// import { ProductCard } from "@/components/ProductCard";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { Search, PlusCircle, Barcode } from "lucide-react";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";

// // Mock data - replace with your actual data
// const mockProducts = [
//   {
//     id: 1,
//     name: "Premium Wireless Headphones",
//     category: "Electronics",
//     price: 299.99,
//     image: "/placeholder.svg",
//     availability: 5,
//   },
//   {
//     id: 2,
//     name: "Smart Watch Series X",
//     category: "Wearables",
//     price: 399.99,
//     image: "/placeholder.svg",
//     availability: 3,
//   },
//   {
//     id: 3,
//     name: "Professional Camera Kit",
//     category: "Photography",
//     price: 1299.99,
//     image: "/placeholder.svg",
//     availability: 0,
//   },
// ];

// const Products = () => {
//   const [searchQuery, setSearchQuery] = useState("");

//   const filteredProducts = mockProducts.filter(product =>
//     product.name.toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   return (
//     <div className="container py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//       <div className="space-y-8">
//         <div className="flex justify-between items-center">
//           <div>
//             <h1 className="text-4xl font-bold mb-2">Products</h1>
//             <p className="text-muted-foreground">
//               Browse and manage your product inventory
//             </p>
//           </div>
          
//           <Dialog>
//             <DialogTrigger asChild>
//               <Button>
//                 <PlusCircle className="mr-2 h-4 w-4" />
//                 Add Product
//               </Button>
//             </DialogTrigger>
//             <DialogContent>
//               <DialogHeader>
//                 <DialogTitle>Add New Product</DialogTitle>
//               </DialogHeader>
//               <div className="space-y-4 py-4">
//                 <Button className="w-full" variant="outline">
//                   <Barcode className="mr-2 h-4 w-4" />
//                   Scan Barcode
//                 </Button>
//                 <div className="space-y-2">
//                   <Input placeholder="Product Name" />
//                   <Input placeholder="Category" />
//                   <Input type="number" placeholder="Price" />
//                   <Input type="number" placeholder="Initial Stock" />
//                 </div>
//                 <Button className="w-full">Add Product</Button>
//               </div>
//             </DialogContent>
//           </Dialog>
//         </div>

//         <div className="relative">
//           <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
//           <Input
//             placeholder="Search products..."
//             className="pl-10"
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//           />
//         </div>

//         <div className="flex flex-col space-y-4">
//           {filteredProducts.map((product) => (
//             <ProductCard key={product.id} {...product} />
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Products;


import { useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, PlusCircle, Barcode } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import useFetchProducts from "@/hooks/useFetchProducts";

const Products = () => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const { products, loading, error } = useFetchProducts(searchQuery);

  return (
    <div className="container py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2">Products</h1>
            <p className="text-muted-foreground">
              Browse and manage your product inventory
            </p>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Button className="w-full" variant="outline">
                  <Barcode className="mr-2 h-4 w-4" />
                  Scan Barcode
                </Button>
                <div className="space-y-2">
                  <Input placeholder="Product Name" />
                  <Input placeholder="Category" />
                  <Input type="number" placeholder="Price" />
                  <Input type="number" placeholder="Initial Stock" />
                </div>
                <Button className="w-full">Add Product</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-col space-y-4">
          {loading && <p>Loading...</p>}
          {error && <p className="text-red-500">{error}</p>}
          {products.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Products;
