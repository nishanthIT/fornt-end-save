// import { useParams, useNavigate } from "react-router-dom";
// import { Store, Phone, MapPin, Plus } from "lucide-react";
// import { ProductCard } from "@/components/ProductCard";
// import { Button } from "@/components/ui/button";

// // Mock data - replace with actual data source later
// const mockShops = [
//   {
//     id: 1,
//     name: "Downtown Store",
//     phone: "+1 234-567-8900",
//     address: "123 Main St, Downtown",
//     products: [
//       { 
//         id: 1, 
//         name: "Product 1", 
//         price: 19.99, 
//         stock: 50,
//         category: "Electronics",
//         image: "/placeholder.svg",
//         availability: 50
//       },
//       { 
//         id: 2, 
//         name: "Product 2", 
//         price: 29.99, 
//         stock: 30,
//         category: "Electronics",
//         image: "/placeholder.svg",
//         availability: 30
//       },
//     ],
//   },
//   {
//     id: 2,
//     name: "Uptown Market",
//     phone: "+1 234-567-8901",
//     address: "456 High St, Uptown",
//     products: [
//       { 
//         id: 3, 
//         name: "Product 3", 
//         price: 39.99, 
//         stock: 20,
//         category: "Electronics",
//         image: "/placeholder.svg",
//         availability: 20
//       },
//       { 
//         id: 4, 
//         name: "Product 4", 
//         price: 49.99, 
//         stock: 15,
//         category: "Electronics",
//         image: "/placeholder.svg",
//         availability: 15
//       },
//     ],
//   },
// ];

// const ShopDetail = () => {
//   const { id } = useParams();
//   const navigate = useNavigate();

//   const shop = mockShops.find((s) => s.id === Number(id));

//   if (!shop) {
//     return <div className="container mx-auto p-6">Shop not found</div>;
//   }

//   return (
//     <div className="container mx-auto p-6">
//       <div className="mb-8">
//         <div className="space-y-4">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center gap-2">
//               <Store className="h-6 w-6" />
//               <h1 className="text-2xl font-bold">{shop.name}</h1>
//             </div>
//             <Button onClick={() => navigate(`/shop/${id}/add-product`)}>
//               <Plus className="mr-2 h-4 w-4" />
//               Add Product
//             </Button>
//           </div>
//           <div className="space-y-2">
//             <div className="flex items-center gap-2 text-muted-foreground">
//               <Phone className="h-4 w-4" />
//               <span>{shop.phone}</span>
//             </div>
//             <div className="flex items-center gap-2 text-muted-foreground">
//               <MapPin className="h-4 w-4" />
//               <span>{shop.address}</span>
//             </div>
//           </div>
//         </div>
//       </div>

//       <h2 className="text-xl font-semibold mb-4">Available Products</h2>
//       <div className="space-y-4">
//         {shop.products.map((product) => (
//           <ProductCard
//             key={product.id}
//             {...product}
//             onClick={() => navigate(`/shop/${shop.id}/product/${product.id}`)}
//           />
//         ))}
//       </div>
//     </div>
//   );
// };

// export default ShopDetail;





import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Store, Phone, MapPin, Plus, Save,PlusCircle, Barcode,Search } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useFetchProducts from "@/hooks/useFetchProducts";
import useFetchProductsAtShop from "@/hooks/useFetchProductsAtShop"; // Adjust path as necessary
import useFetchShopById from "@/hooks/useFetchShopById";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const ShopDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  

  const [activeTab, setActiveTab] = useState("availableProducts");
  const [searchQuery, setSearchQuery] = useState("");
  




  // Use the custom hook to fetch products
  const { products: fetchedProducts, loading, error } = useFetchProducts(searchQuery);
  const { products:AtShopFetchedProduct, loading:AtShoploading,error: AtShoperror } = useFetchProductsAtShop(id);
  const { shop, loading:Shoploading, error:Shoperror } = useFetchShopById(id);

  // if (Shoploading) return <p>Loading...</p>;
  // if (error) return <p>Error: {error}</p>;


  const [products, setProducts] = useState(AtShopFetchedProduct);


useEffect(() => {
  if (AtShopFetchedProduct) {
    setProducts(AtShopFetchedProduct); // Set the fetched products
  }
}, [AtShopFetchedProduct]); // Triggered when fetchedProducts changes


  // const mockShops = [
  //   {
  //     id: 1,
  //     name: "Downtown Store",
  //     phone: "+1 234-567-8900",
  //     address: "123 Main St, Downtown",
  //   },
  // ];

  // const shop = mockShops.find((s) => s.id === Number(id));

  // if (!shop) {
  //   return <div className="container mx-auto p-6">Shop not found</div>;
  // }

  const fallbackImg = "https://via.placeholder.com/64";



  const handlePriceChange = (productId, newPrice) => {
    setProducts((prev) =>
      prev.map((product) =>
        product.productId === productId
          ? { ...product, price: parseFloat(newPrice) || 0 }
          : product
      )
    );
  };

  const handleSavePrice = (productId) => {
    const updatedProduct = products.find((product) => product.productId === productId);
    if (updatedProduct) {
      alert(`${updatedProduct.title} price updated to $${updatedProduct.price}`);
    }
  };

  const filteredProducts = products.filter((product) =>
    product.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Store className="h-6 w-6" />
              <h1 className="text-2xl font-bold">{shop?.name || "Unknown Shop"}</h1>
            </div>
            {/* <Button onClick={() => navigate(`/shop/${id}/add-product`)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button> */}

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
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>{shop?.mobile || "unknown mobile" }</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{shop?.address || "nknown address"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="flex space-x-4">
          <button
            className={`px-4 py-2 border-b-2 ${
              activeTab === "availableProducts"
                ? "border-blue-500 text-blue-500"
                : "border-transparent text-gray-500"
            }`}
            onClick={() => setActiveTab("availableProducts")}
          >
            Available Products
          </button>
          <button
            className={`px-4 py-2 border-b-2 ${
              activeTab === "search"
                ? "border-blue-500 text-blue-500"
                : "border-transparent text-gray-500"
            }`}
            onClick={() => setActiveTab("search")}
          >
            Search & Add Product
          </button>
        </div>
      </div>

      {/* Active Tab Content */}
      {activeTab === "search" && (
        <>
          <div className="mb-8">
            <Input
              placeholder="Search for a product to add..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {loading && <p>Loading...</p>}
          {error && <p className="text-red-500">{error}</p>}
          {!loading && !error && (
            <div className="space-y-4">
              {fetchedProducts.length > 0 ? (
                fetchedProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    title={product.title}
                    productUrl={product.productUrl}
                    caseSize={product.caseSize}
                    packetSize={product.packetSize}
                    img={product.img}
                    barcode={product.barcode}
                    caseBarcode={product.caseBarcode}
                    retailSize={product.retailSize}
                    availability={50} // Assuming availability, update as per your backend
                    onClick={() => console.log(`Added ${product.title}`)}
                  />
                ))
              ) : searchQuery === "" ? (
                <p>Start your search</p>
              ) : (
                <p>No products found for "{searchQuery}".</p>
              )}
            </div>
          )}
        </>
      )}


{activeTab === "availableProducts" && (
          <>
         
          <div className="mb-4">
            <Input
              placeholder="Search for a product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
         
          {/* <h2 className="text-xl font-semibold mb-4">Available Products</h2> */}
          {AtShoploading && <p>Loading...</p>}
          {!AtShoploading && ( <div className="space-y-4">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <div
                key={product.productId}
                className="flex items-center justify-between p-4 border rounded-lg space-x-4"
              >
                <div className="flex items-center space-x-4">
                  <img
                    src={product.img && product.img[0] ? product.img[0] : fallbackImg}
                    alt={product.title}
                    className="w-16 h-16 object-cover rounded-md flex-shrink-0"
                    loading="lazy"
                  />
                  <div>
                    <h3 className="text-lg font-semibold">{product.title}</h3>
                    <div className="text-sm text-gray-500">
  <span>caseSize: {product.caseSize}</span> | <span>retailSize: {product.retailSize}</span> | <span>AILE: {product.price}</span>

</div>

                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    value={product.price}
                    onChange={(e) =>
                      handlePriceChange(product.productId, e.target.value)
                    }
                    className="w-24"
                  />
                  <Button
                    onClick={() => handleSavePrice(product.productId)}
                    size="sm"
                    className="flex items-center justify-center"
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              ))
            ) : (
              <div>No products found.</div>
            )}
          </div>)}
         
        </>
      )}

    </div>
  );
};

export default ShopDetail;
