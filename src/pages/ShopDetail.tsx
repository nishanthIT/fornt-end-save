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








// import { useEffect, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { Store, Phone, MapPin, Plus, Save,PlusCircle, Barcode,Search,Camera, Upload } from "lucide-react";
// import { ProductCard } from "@/components/ProductCard";
// import { ProductCardshop } from "@/components/ProductCardShop";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import useFetchProducts from "@/hooks/useFetchProducts";
// import useFetchProductsAtShop from "@/hooks/useFetchProductsAtShop"; // Adjust path as necessary
// import useFetchShopById from "@/hooks/useFetchShopById";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import BarcodeScannerComponent from "react-qr-barcode-scanner";
// import { toast } from "sonner";
// const ShopDetail = () => {
//   const { id } = useParams();
//   const navigate = useNavigate();


//   const [barcode, setBarcode] = useState("");
//   const [caseBarcode, setCaseBarcode] = useState("");
//   const [title, setTitle] = useState("");
//   const [caseSize, setCaseSize] = useState("");
//   const [packetSize, setPacketSize] = useState("");
//   const [retailSize, setRetailSize] = useState("");
//   const [price, setPrice] = useState("");
//   const [Aiel, setAiel] = useState("");
//   const[rrp,setrrp] = useState("");

//   const [image, setImage] = useState(null);

// const [isSubmitting, setIsSubmitting] = useState(false);
//   const [showScanner, setShowScanner] = useState(false);


  
//   const [activeTab, setActiveTab] = useState("availableProducts");
//   const [searchQuery, setSearchQuery] = useState("");
//   const [imageName, setImageName] = useState("");
//   // Use the custom hook to fetch products
//   const { products: fetchedProducts, loading, error } = useFetchProducts(searchQuery);
//   const { products:AtShopFetchedProduct, loading:AtShoploading,error: AtShoperror } = useFetchProductsAtShop(id);
//   const { shop, loading:Shoploading, error:Shoperror } = useFetchShopById(id);

//   const [products, setProducts] = useState(AtShopFetchedProduct);



// useEffect(() => {
//   if (AtShopFetchedProduct) {
//     setProducts(AtShopFetchedProduct); // Set the fetched products
//   }
// }, [AtShopFetchedProduct]); // Triggered when fetchedProducts changes




//   const fallbackImg = "https://via.placeholder.com/64";





//   const handleImageUpload = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       setImage(URL.createObjectURL(file));
//       if (file) {
//         setImageName(file.name);
//       }
//     }
//   };

// const shopId = id;
// const employeeId = 3;
//   const handleAddProduct =  async () => {

//     const productData = {

//       shopId,
//       title,
//       employeeId,
//       caseSize: parseInt(caseSize) || null,
//       packetSize: parseInt(packetSize) || null,
//       retailSize: parseInt(retailSize) || null,
//       barcode: null, // Set barcode if available
//       caseBarcode: caseBarcode || null,
//       price: parseFloat(price) || null,
//       aiel:Aiel || null,
//       rrp:rrp || null,
//     }
//     try{
//       setIsSubmitting(true)
//       const responce = await fetch("http://localhost:3000/api/addProductAtShop",{
//         method:"POST",
//         headers:{
//           "Content-Type":"application/json"
//         },
//         body: JSON.stringify(productData),

//       });
//       const result = await responce.json();
//       setIsSubmitting(false);
        
 
       
//       if(responce.ok){
//         setTitle("");
//   setCaseSize("");
//   setPacketSize("");
//   setRetailSize("");
//   setPrice("");
//   setAiel("");
//   setrrp("");
//   setCaseBarcode("");
//         toast.success("Product added successfully");
//         console.log("success",result)
        
//       }else {
//         toast.warning(`Error: ${result.error}`);
//       }
//     }catch(error){
//       console.error(error);
//       toast.warning("An error occured. Please try again later.");
//     }
//   }





//   const captureImage = () => {
//     // Logic for capturing image (camera API or third-party library)
//     alert("Capture image functionality goes here");
//   };

//   const handlePriceChange = (productId, newPrice) => {
//     setProducts((prev) =>
//       prev.map((product) =>
//         product.productId === productId
//           ? { ...product, price: parseFloat(newPrice) || 0 }
//           : product
//       )
//     );
//   };

//   const handleSavePrice = (productId) => {
//     const updatedProduct = products.find((product) => product.productId === productId);
//     if (updatedProduct) {
//       alert(`${updatedProduct.title} price updated to $${updatedProduct.price}`);
//     }
//   };



//   const filteredProducts = products.filter((product) =>
//     product.title.toLowerCase().includes(searchQuery.toLowerCase())
//   );
//   return (
//     <div className="container mx-auto p-6">
//       <div className="mb-8">
//         <div className="space-y-4">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center gap-2">
//               <Store className="h-6 w-6" />
//               <h1 className="text-2xl font-bold">{shop?.name || "Unknown Shop"}</h1>
//             </div>
//             {/* <Button onClick={() => navigate(`/shop/${id}/add-product`)}>
//               <Plus className="mr-2 h-4 w-4" />
//               Add Product
//             </Button> */}

// <Dialog>
//             <DialogTrigger asChild>
//               <Button>
//                 <PlusCircle className="mr-2 h-4 w-4" />
//                 Add Product
//               </Button>
//             </DialogTrigger>

//             {/* <DialogContent>
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
//             </DialogContent> */}
//            <DialogContent className="max-h-[80vh] w-full md:w-[400px] overflow-y-auto">
//         <DialogHeader>
//           <DialogTitle>Add New Product</DialogTitle>
//         </DialogHeader>
//         <div className="space-y-4 py-4">
          
//           {/* Barcode Scanner & Manual Entry */}
//           <div className="space-y-2">
//             <label className="block font-semibold">Case Barcode</label>
//             <div className="flex space-x-2">
//               <Button className="w-full" variant="outline" onClick={() => setShowScanner(!showScanner)}>
//                 <Barcode className="mr-2 h-4 w-4" />
//                 {showScanner ? "Close Scanner" : "Scan"}
//               </Button>
//               <Input
//                 type="text"
//                 placeholder="Enter Barcode"
//                 value={caseBarcode}
//                 onChange={(e) => setCaseBarcode(e.target.value)}
//               />
//             </div>
//             {showScanner && (
//               <div className="border rounded-lg p-2">
//                 <BarcodeScannerComponent
//                   width={300}
//                   height={200}
//                   onUpdate={(err, result) => {
//                     if (result) setCaseBarcode(result.text);
//                   }}
//                 />
//               </div>
//             )}
//           </div>
          

//           {/* Other Fields */}
//           <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
//          <Input type="text" placeholder="Case Size" value={caseSize} onChange={(e) => setCaseSize(e.target.value)} required />
//          <Input type="text" placeholder="Packet Size" value={packetSize} onChange={(e) => setPacketSize(e.target.value)} required/>
//          <Input type="text" placeholder="Retail Size" value={retailSize} onChange={(e) => setRetailSize(e.target.value)} required/>
//          <Input type="number" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)}required/>
//          <Input type="text" placeholder="Aiel no" value={Aiel} onChange={(e) => setAiel(e.target.value)}required />
//          <Input type="text" placeholder="rrp" value={rrp} onChange={(e) => setrrp(e.target.value)}required /> 

//          {/* Add Product Button */}
         
//   {/* Add Product Button */}
//   <Button 
//     className="w-full" 
//     type="submit"
//     disabled={isSubmitting}
//     onClick={handleAddProduct}
//   >
//     {isSubmitting ? "Adding Product..." : "Add Product"}
//   </Button>

//          {/* <Button className="w-full" onClick={handleAddProduct}>
//           Add Product
//         </Button> */}
//         </div>
//       </DialogContent>
//           </Dialog>
//           </div>
//           <div className="space-y-2">
//             <div className="flex items-center gap-2 text-muted-foreground">
//               <Phone className="h-4 w-4" />
//               <span>{shop?.mobile || "unknown mobile" }</span>
//             </div>
//             <div className="flex items-center gap-2 text-muted-foreground">
//               <MapPin className="h-4 w-4" />
//               <span>{shop?.address || "nknown address"}</span>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Tab Navigation */}
//       <div className="mb-6">
//         <div className="flex space-x-4">
//           <button
//             className={`px-4 py-2 border-b-2 ${
//               activeTab === "availableProducts"
//                 ? "border-blue-500 text-blue-500"
//                 : "border-transparent text-gray-500"
//             }`}
//             onClick={() => setActiveTab("availableProducts")}
//           >
//             Available Products
//           </button>
//           <button
//             className={`px-4 py-2 border-b-2 ${
//               activeTab === "search"
//                 ? "border-blue-500 text-blue-500"
//                 : "border-transparent text-gray-500"
//             }`}
//             onClick={() => setActiveTab("search")}
//           >
//             Search & Add Product
//           </button>
//         </div>
//       </div>

//       {/* Active Tab Content */}
//       {activeTab === "search" && (
//         <>
//           <div className="mb-8">
//             <Input
//               placeholder="Search for a product to add..."
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//             />
//           </div>
//           {loading && <p>Loading...</p>}
//           {error && <p className="text-red-500">{error}</p>}
//           {!loading && !error && (
//             <div className="space-y-4">
//               {fetchedProducts.length > 0 ? (
//                 fetchedProducts.map((product) => (
//                   <ProductCardshop
//                     key={product.id}
//                     id={product.id}
//                     title={product.title}
//                     productUrl={product.productUrl}
//                     caseSize={product.caseSize}
//                     packetSize={product.packetSize}
//                     img={product.img}
//                     barcode={product.barcode}
//                     caseBarcode={product.caseBarcode}
//                     retailSize={product.retailSize}
//                     availability={50} // Assuming availability, update as per your backend
//                     onClick={() => console.log(`Added ${product.title}`)}
//                   />
//                 ))
//               ) : searchQuery === "" ? (
//                 <p>Start your search</p>
//               ) : (
//                 <p>No products found for "{searchQuery}".</p>
//               )}
//             </div>
//           )}
//         </>
//       )}


// {activeTab === "availableProducts" && (
//           <>
         
//           <div className="mb-4">
//             <Input
//               placeholder="Search for a product..."
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//             />
//           </div>
         
//           {/* <h2 className="text-xl font-semibold mb-4">Available Products</h2> */}
//           {AtShoploading && <p>Loading...</p>}
//           {!AtShoploading && ( <div className="space-y-4">
//             {filteredProducts.length > 0 ? (
//               filteredProducts.map((product) => (
//                 <div
//                 key={product.productId}
//                 className="flex items-center justify-between p-4 border rounded-lg space-x-4"
//               >
//                 <div className="flex items-center space-x-4">
//                   <img
//                     src={product.img && product.img[0] ? product.img[0] : fallbackImg}
//                     alt={product.title}
//                     className="w-16 h-16 object-cover rounded-md flex-shrink-0"
//                     loading="lazy"
//                   />
//                   <div>
//                     <h3 className="text-lg font-semibold">{product.title}</h3>
//                     <div className="text-sm text-gray-500">
//   <span>caseSize: {product.caseSize}</span> | <span>retailSize: {product.retailSize}</span> | <span>AILE: {product.price}</span>

// </div>

//                   </div>
//                 </div>
//                 <div className="flex items-center space-x-2">
//                   <Input
//                     type="number"
//                     value={product.price}
//                     onChange={(e) =>
//                       handlePriceChange(product.productId, e.target.value)
//                     }
//                     className="w-24"
//                   />
//                   <Button
//                     onClick={() => handleSavePrice(product.productId)}
//                     size="sm"
//                     className="flex items-center justify-center"
//                   >
//                     <Save className="h-4 w-4" />
//                   </Button>
//                 </div>
//               </div>
//               ))
//             ) : (
//               <div>No products found.</div>
//             )}
//           </div>)}
         
//         </>
//       )}

//     </div>
//   );
// };

// export default ShopDetail;




// import { useEffect, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { Store, Phone, MapPin, Plus, Save, PlusCircle, Barcode, Search, Camera, Upload } from "lucide-react";
// import { ProductCard } from "@/components/ProductCard";
// import { ProductCardshop } from "@/components/ProductCardShop";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import useFetchProducts from "@/hooks/useFetchProducts";
// import useFetchShopById from "@/hooks/useFetchShopById";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import BarcodeScannerComponent from "react-qr-barcode-scanner";
// import { toast } from "sonner";

// const ShopDetail = () => {
//   const { id } = useParams();
//   const navigate = useNavigate();

//   // Form states
//   const [barcode, setBarcode] = useState("");
//   const [caseBarcode, setCaseBarcode] = useState("");
//   const [title, setTitle] = useState("");
//   const [caseSize, setCaseSize] = useState("");
//   const [packetSize, setPacketSize] = useState("");
//   const [retailSize, setRetailSize] = useState("");
//   const [price, setPrice] = useState("");
//   const [Aiel, setAiel] = useState("");
//   const [rrp, setRrp] = useState("");
//   const [image, setImage] = useState(null);
//   const [imageName, setImageName] = useState("");
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [showScanner, setShowScanner] = useState(false);
  
//   // UI states
//   const [activeTab, setActiveTab] = useState("availableProducts");
//   const [searchQuery, setSearchQuery] = useState("");
//   const [page, setPage] = useState(1);
//   const [limit, setLimit] = useState(10);
//   const [products, setProducts] = useState([]);
//   const [totalProducts, setTotalProducts] = useState(0);
//   const [isLoadingProducts, setIsLoadingProducts] = useState(false);

//   // Fetch shop details
//   const { shop, loading: shopLoading, error: shopError } = useFetchShopById(id);

//   // Fetch products in shop with pagination and search
//   const fetchProductsAtShop = async () => {
//     setIsLoadingProducts(true);
//     try {
//       const response = await fetch(
//         `http://localhost:3000/api/shop/${id}/products?page=${page}&limit=${limit}&search=${searchQuery}`
//       );
//       const data = await response.json();
      
//       if (response.ok) {
//         setProducts(data.products);
//         setTotalProducts(data.total);
//       } else {
//         toast.error("Failed to fetch products");
//       }
//     } catch (error) {
//       console.error("Error fetching products:", error);
//       toast.error("An error occurred while fetching products");
//     } finally {
//       setIsLoadingProducts(false);
//     }
//   };

//   // Search products to add
//   const [searchProductsQuery, setSearchProductsQuery] = useState("");
//   const [availableProducts, setAvailableProducts] = useState([]);
//   const [isSearchingProducts, setIsSearchingProducts] = useState(false);

//   const searchAvailableProducts = async () => {
//     if (!searchProductsQuery.trim()) return;
    
//     setIsSearchingProducts(true);
//     try {
//       const response = await fetch(
//         `http://localhost:3000/api/products/search?query=${searchProductsQuery}&shopId=${id}`
//       );
//       const data = await response.json();
      
//       if (response.ok) {
//         setAvailableProducts(data);
//       } else {
//         toast.error("Failed to search products");
//       }
//     } catch (error) {
//       console.error("Error searching products:", error);
//       toast.error("An error occurred while searching products");
//     } finally {
//       setIsSearchingProducts(false);
//     }
//   };

//   // Effect to fetch products when page, limit, or search changes
//   useEffect(() => {
//     fetchProductsAtShop();
//   }, [id, page, limit, searchQuery]);

//   // Handle search input for available products
//   useEffect(() => {
//     const delayDebounceFn = setTimeout(() => {
//       if (searchProductsQuery.trim() && activeTab === "search") {
//         searchAvailableProducts();
//       }
//     }, 500);

//     return () => clearTimeout(delayDebounceFn);
//   }, [searchProductsQuery, activeTab]);

//   const handleImageUpload = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       setImage(URL.createObjectURL(file));
//       setImageName(file.name);
//     }
//   };

//   const shopId = id;
//   const employeeId = 3;
  
//   const handleAddProduct = async () => {
//     // Set default values if empty
//     const finalCaseSize = caseSize || "1";
//     const finalPacketSize = packetSize || "1";
//     const finalRrp = rrp || price; // Default RRP to price if not provided

//     const productData = {
//       shopId,
//       title,
//       employeeId,
//       caseSize: parseInt(finalCaseSize),
//       packetSize: parseInt(finalPacketSize),
//       retailSize: parseInt(retailSize) || null,
//       barcode: barcode || null,
//       caseBarcode: caseBarcode || null,
//       price: parseFloat(price) || null,
//       aiel: Aiel || null,
//       rrp: parseFloat(finalRrp) || null,
//     };

//     try {
//       setIsSubmitting(true);
//       const response = await fetch("http://localhost:3000/api/addProductAtShop", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(productData),
//       });
      
//       const result = await response.json();
      
//       if (response.ok) {
//         setTitle("");
//         setCaseSize("");
//         setPacketSize("");
//         setRetailSize("");
//         setPrice("");
//         setAiel("");
//         setRrp("");
//         setCaseBarcode("");
//         setBarcode("");
//         toast.success("Product added successfully");
//         fetchProductsAtShop(); // Refresh products list
//       } else {
//         toast.warning(`Error: ${result.error}`);
//       }
//     } catch (error) {
//       console.error(error);
//       toast.warning("An error occurred. Please try again later.");
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const handleAddExistingProduct = async (product) => {
//     try {
//       const productData = {
//         shopId,
//         id: product.id,
//         price: product.price || 0,
//         employeeId,
//         casebarcode: product.caseBarcode || "",
//         aiel: Aiel || "",
//         rrp: product.rrp || 0,
//       };

//       const response = await fetch("http://localhost:3000/api/addProductAtShopifExistAtProduct", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(productData),
//       });

//       const result = await response.json();

//       if (response.ok) {
//         toast.success("Product added to shop successfully");
//         fetchProductsAtShop(); // Refresh products list
//       } else {
//         toast.warning(`Error: ${result.error}`);
//       }
//     } catch (error) {
//       console.error(error);
//       toast.warning("An error occurred. Please try again later.");
//     }
//   };

//   const handlePriceChange = (productId, newPrice) => {
//     setProducts((prev) =>
//       prev.map((product) =>
//         product.productId === productId
//           ? { ...product, price: parseFloat(newPrice) || 0 }
//           : product
//       )
//     );
//   };

//   const handleSavePrice = async (productId) => {
//     const updatedProduct = products.find((product) => product.productId === productId);
//     if (!updatedProduct) return;
    
//     try {
//       const response = await fetch(`http://localhost:3000/api/shop/${id}/updateProductPrice`, {
//         method: "PUT",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           productId,
//           price: updatedProduct.price,
//           employeeId,
//         }),
//       });

//       const result = await response.json();

//       if (response.ok) {
//         toast.success(`${updatedProduct.title} price updated to $${updatedProduct.price}`);
//       } else {
//         toast.warning(`Error: ${result.error}`);
//       }
//     } catch (error) {
//       console.error(error);
//       toast.warning("An error occurred. Please try again later.");
//     }
//   };

//   // Calculate total pages
//   const totalPages = Math.ceil(totalProducts / limit);

//   const fallbackImg = "https://via.placeholder.com/64";

//   return (
//     <div className="container mx-auto p-6">
//       {/* Shop Header */}
//       <div className="mb-8">
//         <div className="space-y-4">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center gap-2">
//               <Store className="h-6 w-6" />
//               <h1 className="text-2xl font-bold">{shop?.name || "Unknown Shop"}</h1>
//             </div>

//             {/* Add Product Dialog */}
//             <Dialog>
//               <DialogTrigger asChild>
//                 <Button>
//                   <PlusCircle className="mr-2 h-4 w-4" />
//                   Add Product
//                 </Button>
//               </DialogTrigger>
//               <DialogContent className="max-h-[80vh] w-full md:w-[400px] overflow-y-auto">
//                 <DialogHeader>
//                   <DialogTitle>Add New Product</DialogTitle>
//                 </DialogHeader>
//                 <div className="space-y-4 py-4">
//                   {/* Barcode Scanner */}
//                   <div className="space-y-2">
//                     <label className="block font-semibold">Case Barcode</label>
//                     <div className="flex space-x-2">
//                       <Button className="w-full" variant="outline" onClick={() => setShowScanner(!showScanner)}>
//                         <Barcode className="mr-2 h-4 w-4" />
//                         {showScanner ? "Close Scanner" : "Scan"}
//                       </Button>
//                       <Input
//                         type="text"
//                         placeholder="Enter Barcode"
//                         value={caseBarcode}
//                         onChange={(e) => setCaseBarcode(e.target.value)}
//                       />
//                     </div>
//                     {showScanner && (
//                       <div className="border rounded-lg p-2">
//                         <BarcodeScannerComponent
//                           width={300}
//                           height={200}
//                           onUpdate={(err, result) => {
//                             if (result) setCaseBarcode(result.text);
//                           }}
//                         />
//                       </div>
//                     )}
//                   </div>

//                   {/* Product barcode field */}
//                   <div className="space-y-2">
//                     <label className="block font-semibold">Product Barcode</label>
//                     <Input 
//                       type="text" 
//                       placeholder="Product Barcode" 
//                       value={barcode} 
//                       onChange={(e) => setBarcode(e.target.value)} 
//                     />
//                   </div>

//                   {/* Other Fields */}
//                   <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
//                   <Input type="text" placeholder="Case Size (default: 1)" value={caseSize} onChange={(e) => setCaseSize(e.target.value)} />
//                   <Input type="text" placeholder="Packet Size (default: 1)" value={packetSize} onChange={(e) => setPacketSize(e.target.value)} />
//                   <Input type="text" placeholder="Retail Size" value={retailSize} onChange={(e) => setRetailSize(e.target.value)} required/>
//                   <Input type="number" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} required/>
//                   <Input type="text" placeholder="Aiel no" value={Aiel} onChange={(e) => setAiel(e.target.value)} required />
//                   <Input type="text" placeholder="RRP (optional)" value={rrp} onChange={(e) => setRrp(e.target.value)} /> 

//                   {/* Add Product Button */}
//                   <Button 
//                     className="w-full" 
//                     type="submit"
//                     disabled={isSubmitting}
//                     onClick={handleAddProduct}
//                   >
//                     {isSubmitting ? "Adding Product..." : "Add Product"}
//                   </Button>
//                 </div>
//               </DialogContent>
//             </Dialog>
//           </div>
//           <div className="space-y-2">
//             <div className="flex items-center gap-2 text-muted-foreground">
//               <Phone className="h-4 w-4" />
//               <span>{shop?.mobile || "Unknown mobile"}</span>
//             </div>
//             <div className="flex items-center gap-2 text-muted-foreground">
//               <MapPin className="h-4 w-4" />
//               <span>{shop?.address || "Unknown address"}</span>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Tab Navigation */}
//       <div className="mb-6">
//         <div className="flex space-x-4">
//           <button
//             className={`px-4 py-2 border-b-2 ${
//               activeTab === "availableProducts"
//                 ? "border-blue-500 text-blue-500"
//                 : "border-transparent text-gray-500"
//             }`}
//             onClick={() => setActiveTab("availableProducts")}
//           >
//             Available Products
//           </button>
//           <button
//             className={`px-4 py-2 border-b-2 ${
//               activeTab === "search"
//                 ? "border-blue-500 text-blue-500"
//                 : "border-transparent text-gray-500"
//             }`}
//             onClick={() => setActiveTab("search")}
//           >
//             Search & Add Product
//           </button>
//         </div>
//       </div>

//       {/* Search & Add Products Tab */}
//       {activeTab === "search" && (
//         <>
//           <div className="mb-8 flex items-center space-x-2">
//             <Input
//               placeholder="Search for a product to add..."
//               value={searchProductsQuery}
//               onChange={(e) => setSearchProductsQuery(e.target.value)}
//               className="flex-1"
//             />
//             <Button onClick={searchAvailableProducts} disabled={isSearchingProducts}>
//               <Search className="h-4 w-4 mr-2" />
//               {isSearchingProducts ? "Searching..." : "Search"}
//             </Button>
//           </div>
          
//           {isSearchingProducts && <p>Searching for products...</p>}
          
//           <div className="space-y-4">
//             {availableProducts.length > 0 ? (
//               availableProducts.map((product) => (
//                 <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
//                   <div className="flex items-center space-x-4">
//                     <img
//                       src={product.img && product.img[0] ? product.img[0] : fallbackImg}
//                       alt={product.title}
//                       className="w-16 h-16 object-cover rounded-md"
//                       loading="lazy"
//                     />
//                     <div>
//                       <h3 className="text-lg font-semibold">{product.title}</h3>
//                       <div className="text-sm text-gray-500 space-x-2">
//                         <span>Case: {product.caseSize || "N/A"}</span>
//                         <span>Packet: {product.packetSize || "N/A"}</span>
//                         <span>Retail: {product.retailSize || "N/A"}</span>
//                       </div>
//                     </div>
//                   </div>
//                   <Button onClick={() => handleAddExistingProduct(product)}>
//                     <Plus className="h-4 w-4 mr-2" />
//                     Add to Shop
//                   </Button>
//                 </div>
//               ))
//             ) : searchProductsQuery === "" ? (
//               <p>Start your search</p>
//             ) : (
//               <p>No products found for "{searchProductsQuery}".</p>
//             )}
//           </div>
//         </>
//       )}

//       {/* Available Products Tab */}
//       {activeTab === "availableProducts" && (
//         <>
//           <div className="mb-4">
//             <Input
//               placeholder="Search for a product..."
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//             />
//           </div>
          
//           {isLoadingProducts && <p>Loading products...</p>}
          
//           <div className="space-y-4">
//             {products.length > 0 ? (
//               products.map((product) => (
//                 <div
//                   key={product.productId}
//                   className="flex items-center justify-between p-4 border rounded-lg space-x-4"
//                 >
//                   <div className="flex items-center space-x-4">
//                     <img
//                       src={product.img && product.img[0] ? product.img[0] : fallbackImg}
//                       alt={product.title}
//                       className="w-16 h-16 object-cover rounded-md flex-shrink-0"
//                       loading="lazy"
//                     />
//                     <div>
//                       <h3 className="text-lg font-semibold">{product.title}</h3>
//                       <div className="text-sm text-gray-500">
//                         <span>Case: {product.caseSize || "N/A"}</span> | 
//                         <span>Packet: {product.packetSize || "N/A"}</span> | 
//                         <span>Retail: {product.retailSize || "N/A"}</span> | 
//                         <span>AIEL: {product.aiel || "N/A"}</span>
//                       </div>
//                     </div>
//                   </div>
//                   <div className="flex items-center space-x-2">
//                     <Input
//                       type="number"
//                       value={product.price}
//                       onChange={(e) => handlePriceChange(product.productId, e.target.value)}
//                       className="w-24"
//                     />
//                     <Button
//                       onClick={() => handleSavePrice(product.productId)}
//                       size="sm"
//                       className="flex items-center justify-center"
//                     >
//                       <Save className="h-4 w-4" />
//                     </Button>
//                   </div>
//                 </div>
//               ))
//             ) : (
//               <div>No products found.</div>
//             )}
//           </div>
          
//           {/* Pagination */}
//           {totalPages > 1 && (
//             <div className="flex justify-center items-center space-x-2 mt-6">
//               <Button 
//                 onClick={() => setPage(p => Math.max(1, p - 1))}
//                 disabled={page === 1}
//                 variant="outline"
//                 size="sm"
//               >
//                 Previous
//               </Button>
              
//               <span className="text-sm">
//                 Page {page} of {totalPages}
//               </span>
              
//               <Button 
//                 onClick={() => setPage(p => Math.min(totalPages, p + 1))}
//                 disabled={page === totalPages}
//                 variant="outline"
//                 size="sm"
//               >
//                 Next
//               </Button>
              
//               <select 
//                 className="border rounded p-1 text-sm"
//                 value={limit}
//                 onChange={(e) => {
//                   setLimit(Number(e.target.value));
//                   setPage(1); // Reset to first page on limit change
//                 }}
//               >
//                 <option value="10">10 per page</option>
//                 <option value="20">20 per page</option>
//                 <option value="50">50 per page</option>
//               </select>
//             </div>
//           )}
//         </>
//       )}
//     </div>
//   );
// };

// export default ShopDetail;





// import { useEffect, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { Store, Phone, MapPin, Plus, Save, PlusCircle, Barcode, Search, Camera, Upload } from "lucide-react";
// import { ProductCard } from "@/components/ProductCard";
// import { ProductCardshop } from "@/components/ProductCardShop";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import useFetchProducts from "@/hooks/useFetchProducts";
// import useFetchProductsAtShop from "@/hooks/useFetchProductsAtShop";
// import useFetchShopById from "@/hooks/useFetchShopById";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import BarcodeScannerComponent from "react-qr-barcode-scanner";
// import { toast } from "sonner";

// const ShopDetail = () => {
//   const { id } = useParams();
//   const navigate = useNavigate();

//   // Form states
//   const [barcode, setBarcode] = useState("");
//   const [caseBarcode, setCaseBarcode] = useState("");
//   const [title, setTitle] = useState("");
//   const [caseSize, setCaseSize] = useState("1"); // Default value set to "1"
//   const [packetSize, setPacketSize] = useState("1"); // Default value set to "1"
//   const [retailSize, setRetailSize] = useState("");
//   const [price, setPrice] = useState("");
//   const [Aiel, setAiel] = useState("");
//   const [rrp, setRrp] = useState("");
//   const [image, setImage] = useState(null);
//   const [imageName, setImageName] = useState("");
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [showScanner, setShowScanner] = useState(false);
  
//   // UI states
//   const [activeTab, setActiveTab] = useState("availableProducts");
//   const [searchQuery, setSearchQuery] = useState("");
  
//   // Selected product for addition
//   const [selectedProduct, setSelectedProduct] = useState(null);
//   const [showAddProductDialog, setShowAddProductDialog] = useState(false);
//   const [addProductCaseBarcode, setAddProductCaseBarcode] = useState("");
//   const [addProductPrice, setAddProductPrice] = useState("");
//   const [addProductAiel, setAddProductAiel] = useState("");
//   const [addProductRrp, setAddProductRrp] = useState("");
//   const [showAddProductScanner, setShowAddProductScanner] = useState(false);
  
//   // Use the custom hooks to fetch products
//   const { products: fetchedProducts, loading, error } = useFetchProducts(searchQuery);
//   const { products: AtShopFetchedProduct, loading: AtShoploading, error: AtShoperror } = useFetchProductsAtShop(id);
//   const { shop, loading: Shoploading, error: Shoperror } = useFetchShopById(id);

//   const [products, setProducts] = useState([]);

//   useEffect(() => {
//     if (AtShopFetchedProduct) {
//       setProducts(AtShopFetchedProduct);
//     }
//   }, [AtShopFetchedProduct]);

//   const fallbackImg = "https://via.placeholder.com/64";

//   const handleImageUpload = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       setImage(URL.createObjectURL(file));
//       setImageName(file.name);
//     }
//   };

//   const shopId = id;
//   const employeeId = 3;
  
//   const handleAddProduct = async () => {
//     // Set default values if empty
//     const finalCaseSize = caseSize || "1";
//     const finalPacketSize = packetSize || "1";
//     const finalRrp = rrp || price; // Default RRP to price if not provided

//     const productData = {
//       shopId,
//       title,
//       employeeId,
//       caseSize: parseInt(finalCaseSize),
//       packetSize: parseInt(finalPacketSize),
//       retailSize: parseInt(retailSize) || null,
//       barcode: barcode || null,
//       caseBarcode: caseBarcode || null,
//       price: parseFloat(price) || null,
//       aiel: Aiel || null,
//       rrp: parseFloat(finalRrp) || null,
//     };

//     try {
//       setIsSubmitting(true);
//       const response = await fetch("http://localhost:3000/api/addProductAtShop", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(productData),
//       });
      
//       const result = await response.json();
      
//       if (response.ok) {
//         setTitle("");
//         setCaseSize("1");
//         setPacketSize("1");
//         setRetailSize("");
//         setPrice("");
//         setAiel("");
//         setRrp("");
//         setCaseBarcode("");
//         setBarcode("");
//         toast.success("Product added successfully");
        
//         // Refresh products list
//         const updatedProducts = await fetchProductsAtShop();
//         if (updatedProducts) {
//           setProducts(updatedProducts);
//         }
//       } else {
//         toast.warning(`Error: ${result.error}`);
//       }
//     } catch (error) {
//       console.error(error);
//       toast.warning("An error occurred. Please try again later.");
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   // Function to open add product dialog with selected product
//   const openAddProductDialog = (product) => {
//     setSelectedProduct(product);
//     setAddProductCaseBarcode(product.caseBarcode || "");
//     setAddProductPrice(product.price || "");
//     setAddProductAiel("");
//     setAddProductRrp(product.rrp || "");
//     setShowAddProductDialog(true);
//   };

//   // Function to add existing product from search
//   const handleAddExistingProduct = async () => {
//     if (!selectedProduct) return;
    
//     try {
//       setIsSubmitting(true);
      
//       // Set default values if empty
//       const finalRrp = addProductRrp || addProductPrice;
      
//       const productData = {
//         shopId,
//         id: selectedProduct.id,
//         employeeId,
//         caseBarcode: addProductCaseBarcode || "",
//         price: parseFloat(addProductPrice) || 0,
//         aiel: addProductAiel || "",
//         rrp: parseFloat(finalRrp) || 0,
//       };

//       const response = await fetch("http://localhost:3000/api/addProductAtShopifExistAtProduct", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(productData),
//       });

//       const result = await response.json();

//       if (response.ok) {
//         toast.success("Product added to shop successfully");
//         setShowAddProductDialog(false);
        
//         // Refresh products list
//         const updatedProducts = await fetchProductsAtShop();
//         if (updatedProducts) {
//           setProducts(updatedProducts);
//         }
//       } else {
//         toast.warning(`Error: ${result.error}`);
//       }
//     } catch (error) {
//       console.error(error);
//       toast.warning("An error occurred. Please try again later.");
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   // Fetch products at shop with updated data
//   const fetchProductsAtShop = async () => {
//     try {
//       const response = await fetch(`http://localhost:3000/api/shop/${id}/products`);
//       const data = await response.json();
      
//       if (response.ok) {
//         return data;
//       } else {
//         toast.error("Failed to fetch products");
//         return null;
//       }
//     } catch (error) {
//       console.error("Error fetching products:", error);
//       toast.error("An error occurred while fetching products");
//       return null;
//     }
//   };

//   const handlePriceChange = (productId, newPrice) => {
//     setProducts((prev) =>
//       prev.map((product) =>
//         product.productId === productId
//           ? { ...product, price: parseFloat(newPrice) || 0 }
//           : product
//       )
//     );
//   };

//   const handleSavePrice = async (productId) => {
//     const updatedProduct = products.find((product) => product.productId === productId);
//     if (!updatedProduct) return;
    
//     try {
//       const response = await fetch(`http://localhost:3000/api/shop/${id}/updateProductPrice`, {
//         method: "PUT",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           productId,
//           price: updatedProduct.price,
//           employeeId,
//         }),
//       });

//       const result = await response.json();

//       if (response.ok) {
//         toast.success(`${updatedProduct.title} price updated to $${updatedProduct.price}`);
//       } else {
//         toast.warning(`Error: ${result.error}`);
//       }
//     } catch (error) {
//       console.error(error);
//       toast.warning("An error occurred. Please try again later.");
//     }
//   };

//   const filteredProducts = products.filter((product) =>
//     product.title.toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   return (
//     <div className="container mx-auto p-6">
//       {/* Shop Header */}
//       <div className="mb-8">
//         <div className="space-y-4">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center gap-2">
//               <Store className="h-6 w-6" />
//               <h1 className="text-2xl font-bold">{shop?.name || "Unknown Shop"}</h1>
//             </div>

//             {/* Add New Product Dialog */}
//             <Dialog>
//               <DialogTrigger asChild>
//                 <Button>
//                   <PlusCircle className="mr-2 h-4 w-4" />
//                   Add Product
//                 </Button>
//               </DialogTrigger>
//               <DialogContent className="max-h-[80vh] w-full md:w-[400px] overflow-y-auto">
//                 <DialogHeader>
//                   <DialogTitle>Add New Product</DialogTitle>
//                 </DialogHeader>
//                 <div className="space-y-4 py-4">
//                   {/* Barcode Scanner */}
//                   <div className="space-y-2">
//                     <label className="block font-semibold">Case Barcode</label>
//                     <div className="flex space-x-2">
//                       <Button className="w-full" variant="outline" onClick={() => setShowScanner(!showScanner)}>
//                         <Barcode className="mr-2 h-4 w-4" />
//                         {showScanner ? "Close Scanner" : "Scan"}
//                       </Button>
//                       <Input
//                         type="text"
//                         placeholder="Enter Barcode"
//                         value={caseBarcode}
//                         onChange={(e) => setCaseBarcode(e.target.value)}
//                       />
//                     </div>
//                     {showScanner && (
//                       <div className="border rounded-lg p-2">
//                         <BarcodeScannerComponent
//                           width={300}
//                           height={200}
//                           onUpdate={(err, result) => {
//                             if (result) setCaseBarcode(result.text);
//                           }}
//                         />
//                       </div>
//                     )}
//                   </div>

//                   {/* Product barcode field */}
//                   <div className="space-y-2">
//                     <label className="block font-semibold">Product Barcode</label>
//                     <Input 
//                       type="text" 
//                       placeholder="Product Barcode" 
//                       value={barcode} 
//                       onChange={(e) => setBarcode(e.target.value)} 
//                     />
//                   </div>

//                   {/* Other Fields */}
//                   <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
//                   <Input type="text" placeholder="Case Size (default: 1)" value={caseSize} onChange={(e) => setCaseSize(e.target.value)} />
//                   <Input type="text" placeholder="Packet Size (default: 1)" value={packetSize} onChange={(e) => setPacketSize(e.target.value)} />
//                   <Input type="text" placeholder="Retail Size" value={retailSize} onChange={(e) => setRetailSize(e.target.value)} required/>
//                   <Input type="number" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} required/>
//                   <Input type="text" placeholder="Aiel no" value={Aiel} onChange={(e) => setAiel(e.target.value)} required />
//                   <Input type="text" placeholder="RRP (optional)" value={rrp} onChange={(e) => setRrp(e.target.value)} /> 

//                   {/* Add Product Button */}
//                   <Button 
//                     className="w-full" 
//                     type="submit"
//                     disabled={isSubmitting}
//                     onClick={handleAddProduct}
//                   >
//                     {isSubmitting ? "Adding Product..." : "Add Product"}
//                   </Button>
//                 </div>
//               </DialogContent>
//             </Dialog>
//           </div>
//           <div className="space-y-2">
//             <div className="flex items-center gap-2 text-muted-foreground">
//               <Phone className="h-4 w-4" />
//               <span>{shop?.mobile || "Unknown mobile"}</span>
//             </div>
//             <div className="flex items-center gap-2 text-muted-foreground">
//               <MapPin className="h-4 w-4" />
//               <span>{shop?.address || "Unknown address"}</span>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Tab Navigation */}
//       <div className="mb-6">
//         <div className="flex space-x-4">
//           <button
//             className={`px-4 py-2 border-b-2 ${
//               activeTab === "availableProducts"
//                 ? "border-blue-500 text-blue-500"
//                 : "border-transparent text-gray-500"
//             }`}
//             onClick={() => setActiveTab("availableProducts")}
//           >
//             Available Products
//           </button>
//           <button
//             className={`px-4 py-2 border-b-2 ${
//               activeTab === "search"
//                 ? "border-blue-500 text-blue-500"
//                 : "border-transparent text-gray-500"
//             }`}
//             onClick={() => setActiveTab("search")}
//           >
//             Search & Add Product
//           </button>
//         </div>
//       </div>

//       {/* Search & Add Products Tab */}
//       {activeTab === "search" && (
//         <>
//           <div className="mb-8">
//             <Input
//               placeholder="Search for a product to add..."
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//             />
//           </div>
//           {loading && <p>Loading...</p>}
//           {error && <p className="text-red-500">{error}</p>}
//           {!loading && !error && (
//             <div className="space-y-4">
//               {fetchedProducts.length > 0 ? (
//                 fetchedProducts.map((product) => (
//                   <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
//                     <div className="flex items-center space-x-4">
//                       <img
//                         src={product.img && product.img[0] ? product.img[0] : fallbackImg}
//                         alt={product.title}
//                         className="w-16 h-16 object-cover rounded-md"
//                         loading="lazy"
//                       />
//                       <div>
//                         <h3 className="text-lg font-semibold">{product.title}</h3>
//                         <div className="text-sm text-gray-500 space-x-2">
//                           <span>Case: {product.caseSize || "N/A"}</span>
//                           <span>Packet: {product.packetSize || "N/A"}</span>
//                           <span>Retail: {product.retailSize || "N/A"}</span>
//                         </div>
//                       </div>
//                     </div>
//                     <Button onClick={() => openAddProductDialog(product)}>
//                       <Plus className="h-4 w-4 mr-2" />
//                       Add to Shop
//                     </Button>
//                   </div>
//                 ))
//               ) : searchQuery === "" ? (
//                 <p>Start your search</p>
//               ) : (
//                 <p>No products found for "{searchQuery}".</p>
//               )}
//             </div>
//           )}
//         </>
//       )}

//       {/* Available Products Tab */}
//       {activeTab === "availableProducts" && (
//         <>
//           <div className="mb-4">
//             <Input
//               placeholder="Search for a product..."
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//             />
//           </div>
          
//           {AtShoploading && <p>Loading products...</p>}
          
//           {!AtShoploading && (
//             <div className="space-y-4">
//               {filteredProducts.length > 0 ? (
//                 filteredProducts.map((product) => (
//                   <div
//                     key={product.productId}
//                     className="flex items-center justify-between p-4 border rounded-lg space-x-4"
//                   >
//                     <div className="flex items-center space-x-4">
//                       <img
//                         src={product.img && product.img[0] ? product.img[0] : fallbackImg}
//                         alt={product.title}
//                         className="w-16 h-16 object-cover rounded-md flex-shrink-0"
//                         loading="lazy"
//                       />
//                       <div>
//                         <h3 className="text-lg font-semibold">{product.title}</h3>
//                         <div className="text-sm text-gray-500">
//                           <span>Case: {product.caseSize || "N/A"}</span> | 
//                           <span>Packet: {product.packetSize || "N/A"}</span> | 
//                           <span>Retail: {product.retailSize || "N/A"}</span> | 
//                           <span>AIEL: {product.aiel || "N/A"}</span>
//                         </div>
//                       </div>
//                     </div>
//                     <div className="flex items-center space-x-2">
//                       <Input
//                         type="number"
//                         value={product.price}
//                         onChange={(e) => handlePriceChange(product.productId, e.target.value)}
//                         className="w-24"
//                       />
//                       <Button
//                         onClick={() => handleSavePrice(product.productId)}
//                         size="sm"
//                         className="flex items-center justify-center"
//                       >
//                         <Save className="h-4 w-4" />
//                       </Button>
//                     </div>
//                   </div>
//                 ))
//               ) : (
//                 <div>No products found.</div>
//               )}
//             </div>
//           )}
//         </>
//       )}

//       {/* Dialog for adding existing product with details */}
//       <Dialog open={showAddProductDialog} onOpenChange={setShowAddProductDialog}>
//         <DialogContent className="max-h-[80vh] w-full md:w-[400px] overflow-y-auto">
//           <DialogHeader>
//             <DialogTitle>Add Product to Shop</DialogTitle>
//           </DialogHeader>
//           <div className="space-y-4 py-4">
//             {selectedProduct && (
//               <div className="flex items-center space-x-4 mb-4">
//                 <img
//                   src={selectedProduct.img && selectedProduct.img[0] ? selectedProduct.img[0] : fallbackImg}
//                   alt={selectedProduct.title}
//                   className="w-16 h-16 object-cover rounded-md"
//                   loading="lazy"
//                 />
//                 <div>
//                   <h3 className="text-lg font-semibold">{selectedProduct.title}</h3>
//                   <div className="text-sm text-gray-500 space-x-2">
//                     <span>Case: {selectedProduct.caseSize || "N/A"}</span>
//                     <span>Packet: {selectedProduct.packetSize || "N/A"}</span>
//                   </div>
//                 </div>
//               </div>
//             )}
            
//             {/* Barcode Scanner for Adding Existing Product */}
//             <div className="space-y-2">
//               <label className="block font-semibold">Case Barcode</label>
//               <div className="flex space-x-2">
//                 <Button className="w-full" variant="outline" onClick={() => setShowAddProductScanner(!showAddProductScanner)}>
//                   <Barcode className="mr-2 h-4 w-4" />
//                   {showAddProductScanner ? "Close Scanner" : "Scan"}
//                 </Button>
//                 <Input
//                   type="text"
//                   placeholder="Enter Barcode"
//                   value={addProductCaseBarcode}
//                   onChange={(e) => setAddProductCaseBarcode(e.target.value)}
//                 />
//               </div>
//               {showAddProductScanner && (
//                 <div className="border rounded-lg p-2">
//                   <BarcodeScannerComponent
//                     width={300}
//                     height={200}
//                     onUpdate={(err, result) => {
//                       if (result) setAddProductCaseBarcode(result.text);
//                     }}
//                   />
//                 </div>
//               )}
//             </div>
            
//             {/* Required fields for adding existing product */}
//             <div className="space-y-2">
//               <label className="block font-semibold">Price</label>
//               <Input
//                 type="number"
//                 placeholder="Enter Price"
//                 value={addProductPrice}
//                 onChange={(e) => setAddProductPrice(e.target.value)}
//                 required
//               />
//             </div>
            
//             <div className="space-y-2">
//               <label className="block font-semibold">AIEL Number</label>
//               <Input
//                 type="text"
//                 placeholder="Enter AIEL Number"
//                 value={addProductAiel}
//                 onChange={(e) => setAddProductAiel(e.target.value)}
//               />
//             </div>
            
//             <div className="space-y-2">
//               <label className="block font-semibold">RRP (Optional)</label>
//               <Input
//                 type="number"
//                 placeholder="Enter RRP"
//                 value={addProductRrp}
//                 onChange={(e) => setAddProductRrp(e.target.value)}
//               />
//             </div>
            
//             {/* Add Product Button */}
//             <Button 
//               className="w-full" 
//               disabled={isSubmitting}
//               onClick={handleAddExistingProduct}
//             >
//               {isSubmitting ? "Adding Product..." : "Add Product to Shop"}
//             </Button>
//           </div>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// };

// export default ShopDetail;







import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Store, Phone, MapPin, Plus, Save, PlusCircle, Barcode, Search, Camera, Upload } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { ProductCardshop } from "@/components/ProductCardShop";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useFetchProducts from "@/hooks/useFetchProducts";
import useFetchProductsAtShop from "@/hooks/useFetchProductsAtShop";
import useFetchShopById from "@/hooks/useFetchShopById";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import BarcodeScannerComponent from "react-qr-barcode-scanner";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const ShopDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
   const { user } = useAuth();

  // Form states
  const [barcode, setBarcode] = useState("");
  const [caseBarcode, setCaseBarcode] = useState("");
  const [title, setTitle] = useState("");
  const [caseSize, setCaseSize] = useState("1");
  const [packetSize, setPacketSize] = useState("1");
  const [retailSize, setRetailSize] = useState("");
  const [price, setPrice] = useState("");
  const [Aiel, setAiel] = useState("");
  const [rrp, setRrp] = useState("");
  const [image, setImage] = useState(null);
  const [imageName, setImageName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  
  // UI states
  const [activeTab, setActiveTab] = useState("availableProducts");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Selected product for addition
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showAddProductDialog, setShowAddProductDialog] = useState(false);
  const [addProductCaseBarcode, setAddProductCaseBarcode] = useState("");
  const [addProductPrice, setAddProductPrice] = useState("");
  const [addProductAiel, setAddProductAiel] = useState("");
  const [addProductRrp, setAddProductRrp] = useState("");
  const [addProductcaseSize , setAddProductcaseSize ] = useState("");
  const [addProductpacketSize, setAddProductpacketSize] = useState("");
  const [showAddProductScanner, setShowAddProductScanner] = useState(false);
  
  // Force refresh state
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Use the custom hooks to fetch products
  const { products: fetchedProducts, loading, error } = useFetchProducts(searchQuery);
  const { 
    products: productsAtShop, 
    loading: productsAtShopLoading, 
    error: productsAtShopError,
    refetch: refetchProductsAtShop 
  } = useFetchProductsAtShop(id, refreshTrigger);
  const { shop, loading: shopLoading, error: shopError } = useFetchShopById(id);

  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (productsAtShop && Array.isArray(productsAtShop)) {
      setProducts(productsAtShop);
    }
  }, [productsAtShop]);

  const fallbackImg = "https://via.placeholder.com/64";

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(URL.createObjectURL(file));
      setImageName(file.name);
    }
  };

  const shopId = id;
  const employeeId = user.id;
  
  const handleAddProduct = async () => {
    // Set default values if empty
    const finalCaseSize = caseSize || "1";
    const finalPacketSize = packetSize || "1";
    const finalRrp = rrp || price; // Default RRP to price if not provided

    const productData = {
      shopId,
      title,
      employeeId,
      caseSize: parseInt(finalCaseSize),
      packetSize: parseInt(finalPacketSize),
      retailSize: parseInt(retailSize) || null,
      barcode: barcode || null,
      caseBarcode: caseBarcode || null,
      price: parseFloat(price) || null,
      aiel: Aiel || null,
      rrp: parseFloat(finalRrp) || null,
    };

    try {
      setIsSubmitting(true);
      const response = await fetch("http://localhost:3000/api/addProductAtShop", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setTitle("");
        setCaseSize("1");
        setPacketSize("1");
        setRetailSize("");
        setPrice("");
        setAiel("");
        setRrp("");
        setCaseBarcode("");
        setBarcode("");
        toast.success("Product added successfully");
        
        // Trigger a refresh of products
        setRefreshTrigger(prev => prev + 1);
        await refetchProductsAtShop();
      } else {
        toast.warning(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error(error);
      toast.warning("An error occurred. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to open add product dialog with selected product
  const openAddProductDialog = (product) => {
    setSelectedProduct(product);
    setAddProductCaseBarcode(product.caseBarcode || "");
    setAddProductPrice(product.price || "");
    setAddProductAiel("");
    setAddProductRrp(product.rrp || "");
    setAddProductpacketSize(product.packetSize || ""); 
    setAddProductcaseSize(product.caseSize || ""); 
    setShowAddProductDialog(true);
  };

  // Function to add existing product from search
  const handleAddExistingProduct = async () => {
    if (!selectedProduct) return;
    
    try {
      setIsSubmitting(true);
      
      // Set default values if empty
      const finalRrp = addProductRrp || addProductPrice;
      
      const productData = {
        shopId,
        id: selectedProduct.id,
        employeeId,
        caseBarcode: addProductCaseBarcode || "",
        price: parseFloat(addProductPrice) || 0,
        aiel: addProductAiel || "",
        rrp: parseFloat(finalRrp) || 0,
        packetSize,
        caseSize
        
      };

      const response = await fetch("http://localhost:3000/api/addProductAtShopifExistAtProduct", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Product added to shop successfully");
        setShowAddProductDialog(false);
        
        // Trigger a refresh of products
        setRefreshTrigger(prev => prev + 1);
        await refetchProductsAtShop();
      } else {
        toast.warning(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error(error);
      toast.warning("An error occurred. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePriceChange = (productId, newPrice) => {
    setProducts((prev) =>
      prev.map((product) =>
        product.productId === productId
          ? { ...product, price: parseFloat(newPrice) || 0 }
          : product
      )
    );
  };

  const handleSavePrice = async (productId) => {
    const updatedProduct = products.find((product) => product.productId === productId);
    if (!updatedProduct) return;
    
    try {
      const response = await fetch(`http://localhost:3000/api/shop/${id}/updateProductPrice`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          price: updatedProduct.price,
          employeeId,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`${updatedProduct.title} price updated to $${updatedProduct.price}`);
        // Refresh products after price update
        setRefreshTrigger(prev => prev + 1);
      } else {
        toast.warning(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error(error);
      toast.warning("An error occurred. Please try again later.");
    }
  };

  const filteredProducts = products && products.length > 0
    ? products.filter((product) =>
        product.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <div className="container mx-auto p-6">
      {/* Shop Header */}
      <div className="mb-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Store className="h-6 w-6" />
              <h1 className="text-2xl font-bold">{shop?.name || "Unknown Shop"}</h1>
            </div>

            {/* Add New Product Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[80vh] w-full md:w-[400px] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Product</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {/* Barcode Scanner */}
                  <div className="space-y-2">
                    <label className="block font-semibold">Case Barcode</label>
                    <div className="flex space-x-2">
                      <Button className="w-full" variant="outline" onClick={() => setShowScanner(!showScanner)}>
                        <Barcode className="mr-2 h-4 w-4" />
                        {showScanner ? "Close Scanner" : "Scan"}
                      </Button>
                      <Input
                        type="text"
                        placeholder="Enter Barcode"
                        value={caseBarcode}
                        onChange={(e) => setCaseBarcode(e.target.value)}
                      />
                    </div>
                    {showScanner && (
                      <div className="border rounded-lg p-2">
                        <BarcodeScannerComponent
                          width={300}
                          height={200}
                          onUpdate={(err, result) => {
                            if (result) setCaseBarcode(result.text);
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Product barcode field */}
                  <div className="space-y-2">
                    <label className="block font-semibold">Product Barcode</label>
                    <Input 
                      type="text" 
                      placeholder="Product Barcode" 
                      value={barcode} 
                      onChange={(e) => setBarcode(e.target.value)} 
                    />
                  </div>

                  {/* Other Fields */}
                  <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
                  <Input type="text" placeholder="Case Size (default: 1)" value={caseSize} onChange={(e) => setCaseSize(e.target.value)} />
                  <Input type="text" placeholder="Packet Size (default: 1)" value={packetSize} onChange={(e) => setPacketSize(e.target.value)} />
                  <Input type="text" placeholder="Retail Size" value={retailSize} onChange={(e) => setRetailSize(e.target.value)} required/>
                  <Input type="number" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} required/>
                  <Input type="text" placeholder="Aiel no" value={Aiel} onChange={(e) => setAiel(e.target.value)} required />
                  <Input type="text" placeholder="RRP (optional)" value={rrp} onChange={(e) => setRrp(e.target.value)} /> 

                  {/* Add Product Button */}
                  <Button 
                    className="w-full" 
                    type="submit"
                    disabled={isSubmitting}
                    onClick={handleAddProduct}
                  >
                    {isSubmitting ? "Adding Product..." : "Add Product"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>{shop?.mobile || "Unknown mobile"}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{shop?.address || "Unknown address"}</span>
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

      {/* Search & Add Products Tab */}
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
              {fetchedProducts && fetchedProducts.length > 0 ? (
                fetchedProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <img
                        src={product.img && product.img[0] ? product.img[0] : fallbackImg}
                        alt={product.title}
                        className="w-16 h-16 object-cover rounded-md"
                        loading="lazy"
                      />
                      <div>
                        <h3 className="text-lg font-semibold">{product.title}</h3>
                        <div className="text-sm text-gray-500 space-x-2">
                          <span>Case: {product.caseSize || "N/A"}</span>
                          <span>Packet: {product.packetSize || "N/A"}</span>
                          <span>Retail: {product.retailSize || "N/A"}</span>
                        </div>
                      </div>
                    </div>
                    <Button onClick={() => openAddProductDialog(product)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add to Shop
                    </Button>
                  </div>
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

      {/* Available Products Tab */}
      {activeTab === "availableProducts" && (
        <>
          <div className="mb-4">
            <Input
              placeholder="Search for a product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {productsAtShopLoading && <p>Loading products...</p>}
          {productsAtShopError && <p className="text-red-500">Error loading products: {productsAtShopError}</p>}
          
          {!productsAtShopLoading && (
            <div className="space-y-4">
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
                          <span>Case: {product.caseSize || "N/A"}</span> | 
                          <span>Packet: {product.packetSize || "N/A"}</span> | 
                          <span>Retail: {product.retailSize || "N/A"}</span> | 
                          <span>AIEL: {product.aiel || "N/A"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        value={product.price}
                        onChange={(e) => handlePriceChange(product.productId, e.target.value)}
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
                <div>No products found. {products && products.length > 0 ? `Found ${products.length} products total, but none match the current search.` : "No products available in this shop yet."}</div>
              )}
            </div>
          )}
        </>
      )}

      {/* Dialog for adding existing product with details */}
      <Dialog open={showAddProductDialog} onOpenChange={setShowAddProductDialog}>
        <DialogContent className="max-h-[80vh] w-full md:w-[400px] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Product to Shop</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedProduct && (
              <div className="flex items-center space-x-4 mb-4">
                <img
                  src={selectedProduct.img && selectedProduct.img[0] ? selectedProduct.img[0] : fallbackImg}
                  alt={selectedProduct.title}
                  className="w-16 h-16 object-cover rounded-md"
                  loading="lazy"
                />
                <div>
                  <h3 className="text-lg font-semibold">{selectedProduct.title}</h3>
                  <div className="text-sm text-gray-500 space-x-2">
                    <span>Case: {selectedProduct.caseSize || "N/A"}</span>
                    <span>Packet: {selectedProduct.packetSize || "N/A"}</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Barcode Scanner for Adding Existing Product */}
            <div className="space-y-2">
              <label className="block font-semibold">Case Barcode</label>
              <div className="flex space-x-2">
                <Button className="w-full" variant="outline" onClick={() => setShowAddProductScanner(!showAddProductScanner)}>
                  <Barcode className="mr-2 h-4 w-4" />
                  {showAddProductScanner ? "Close Scanner" : "Scan"}
                </Button>
                <Input
                  type="text"
                  placeholder="Enter Barcode"
                  value={addProductCaseBarcode}
                  onChange={(e) => setAddProductCaseBarcode(e.target.value)}
                />
              </div>
              {showAddProductScanner && (
                <div className="border rounded-lg p-2">
                  <BarcodeScannerComponent
                    width={300}
                    height={200}
                    onUpdate={(err, result) => {
                      if (result) setAddProductCaseBarcode(result.text);
                    }}
                  />
                </div>
              )}
            </div>
            
            {/* Required fields for adding existing product */}
            <div className="space-y-2">
              <label className="block font-semibold">Price</label>
              <Input
                type="number"
                placeholder="Enter Price"
                value={addProductPrice}
                onChange={(e) => setAddProductPrice(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="block font-semibold">AIEL Number</label>
              <Input
                type="text"
                placeholder="Enter AIEL Number"
                value={addProductAiel}
                onChange={(e) => setAddProductAiel(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="block font-semibold">RRP</label>
              <Input
                type="number"
                placeholder="Enter RRP"
                value={addProductRrp}
                onChange={(e) => setAddProductRrp(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="block font-semibold">caseSize</label>
              <Input
                type="number"
                placeholder="Enter RRP"
                value={addProductcaseSize}
                onChange={(e) => setAddProductcaseSize(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="block font-semibold">packetSize</label>
              <Input
                type="number"
                placeholder="Enter RRP"
                value={addProductpacketSize}
                onChange={(e) => setAddProductpacketSize(e.target.value)}
              />
            </div>
            {/* Add Product Button */}
            <Button 
              className="w-full" 
              disabled={isSubmitting}
              onClick={handleAddExistingProduct}
            >
              {isSubmitting ? "Adding Product..." : "Add Product to Shop"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShopDetail;