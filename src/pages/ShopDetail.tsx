





import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Store, Phone, MapPin, Plus, Save, PlusCircle, Barcode, Search, Camera, Upload } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { ProductCardshop } from "@/components/ProductCardShop";
import { ProductAtShopCard } from "@/components/ProductAtShopCard";
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
import BarcodeScanner from "react-qr-barcode-scanner";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { getImageUrl } from "@/utils/imageUtils";

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
  const [showProductNotFoundDialog, setShowProductNotFoundDialog] = useState(false);
  const [notFoundProductName, setNotFoundProductName] = useState("");
  
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

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(URL.createObjectURL(file));
      setImageName(file.name);
    }
  };

  const shopId = id;
  const employeeId = user.id;
  console.log(employeeId)
  
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
      casebarcode: caseBarcode || null,
      price: parseFloat(price) || null,
      aiel: Aiel || null,
      rrp: parseFloat(finalRrp) || null,
    };

    try {
      setIsSubmitting(true);
      const authToken = localStorage.getItem("auth_token");
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api"}/addProductAtShop`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken && { Authorization: `Bearer ${authToken
          }` }),
        },
        body: JSON.stringify(productData),
         credentials: 'include'
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

  // Function to handle product not found scenario
  const handleProductNotFound = (searchTerm) => {
    setNotFoundProductName(searchTerm);
    setShowProductNotFoundDialog(true);
  };

  // Function to confirm adding new product
  const confirmAddNewProduct = () => {
    setTitle(notFoundProductName);
    setShowProductNotFoundDialog(false);
    // Trigger the add product dialog
    document.querySelector('[data-trigger="add-new-product"]')?.click();
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
        casebarcode: addProductCaseBarcode || "",
        price: parseFloat(addProductPrice) || 0,
        aiel: addProductAiel || "",
        rrp: parseFloat(finalRrp) || 0,
        packetSize,
        caseSize
        
      };
      const authToken = localStorage.getItem("auth_token");

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api"}/addProductAtShopifExistAtProduct`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken && { Authorization: `Bearer ${authToken}` }),
        },
        body: JSON.stringify(productData),
         credentials: 'include'
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

  const handleSavePrice = async (productId, newPrice, offerPrice = null, offerExpiryDate = null) => {
    const authToken = localStorage.getItem("auth_token");
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api"}/shop/${id}/updateProductPrice`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(authToken && { Authorization: `Bearer ${authToken}` }),
        },
        body: JSON.stringify({
          productId,
          price: newPrice,
          offerPrice,
          offerExpiryDate,
          employeeId,
        }),
         credentials: 'include'
      });

      const result = await response.json();

      if (response.ok) {
        const product = products.find(p => p.productId === productId);
        toast.success(`${product?.title || 'Product'} updated successfully`);
        // Refresh products after price update
        setRefreshTrigger(prev => prev + 1);
        await refetchProductsAtShop();
      } else {
        toast.warning(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error(error);
      toast.warning("An error occurred. Please try again later.");
    }
  };

  const handlePriceUpdate = (productId, newPrice) => {
    handleSavePrice(productId, newPrice);
  };

  const handleOfferUpdate = (productId, regularPrice, offerPrice, offerExpiryDate) => {
    // Use the provided regular price instead of the old product.price
    handleSavePrice(productId, regularPrice, offerPrice, offerExpiryDate);
  };

  const filteredProducts = products && products.length > 0
    ? products.filter((product) =>
        product.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-6">
      {/* Shop Header */}
      <div className="mb-4 sm:mb-8">
        <div className="space-y-3 sm:space-y-4">
          <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Store className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
              <h1 className="text-xl sm:text-2xl font-bold truncate">{shop?.name || "Unknown Shop"}</h1>
            </div>

            {/* Add New Product Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" className="w-full xs:w-auto flex-shrink-0" data-trigger="add-new-product">
                  <PlusCircle className="mr-1 sm:mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Add Product</span>
                  <span className="sm:hidden">Add</span>
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
                        <BarcodeScanner
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
            <div className="flex items-center gap-2 text-muted-foreground text-sm sm:text-base">
              <Phone className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="truncate">{shop?.mobile || "Unknown mobile"}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm sm:text-base">
              <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="truncate">{shop?.address || "Unknown address"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-4 sm:mb-6">
        <div className="flex space-x-2 sm:space-x-4 overflow-x-auto">
          <button
            className={`px-3 sm:px-4 py-2 border-b-2 whitespace-nowrap text-sm sm:text-base ${
              activeTab === "availableProducts"
                ? "border-blue-500 text-blue-500"
                : "border-transparent text-gray-500"
            }`}
            onClick={() => setActiveTab("availableProducts")}
          >
            <span className="hidden sm:inline">Available Products</span>
            <span className="sm:hidden">Available</span>
          </button>
          <button
            className={`px-3 sm:px-4 py-2 border-b-2 whitespace-nowrap text-sm sm:text-base ${
              activeTab === "search"
                ? "border-blue-500 text-blue-500"
                : "border-transparent text-gray-500"
            }`}
            onClick={() => setActiveTab("search")}
          >
            <span className="hidden sm:inline">Search & Add Product</span>
            <span className="sm:hidden">Search & Add</span>
          </button>
        </div>
      </div>

      {/* Search & Add Products Tab */}
      {activeTab === "search" && (
        <>
          <div className="mb-4 sm:mb-8">
            <Input
              placeholder="Search for a product to add..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          {loading && <p>Loading...</p>}
          {error && <p className="text-red-500">{error}</p>}
          {!loading && !error && (
            <div className="space-y-3 sm:space-y-4">
              {fetchedProducts && fetchedProducts.length > 0 ? (
                fetchedProducts.map((product) => (
                  <div key={product.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-3 sm:gap-4">
                    <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                      <img
                        src={getImageUrl(product.img)}
                        alt={product.title}
                        className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-md flex-shrink-0"
                        loading="lazy"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm sm:text-lg font-semibold truncate">{product.title}</h3>
                        <div className="text-xs sm:text-sm text-gray-500 flex flex-wrap gap-1 sm:gap-2">
                          <span>Case: {product.caseSize || "N/A"}</span>
                          <span className="hidden sm:inline">•</span>
                          <span>Packet: {product.packetSize || "N/A"}</span>
                          <span className="hidden sm:inline">•</span>
                          <span>Retail: {product.retailSize || "N/A"}</span>
                        </div>
                      </div>
                    </div>
                    <Button 
                      onClick={() => openAddProductDialog(product)}
                      size="sm"
                      className="w-full sm:w-auto flex-shrink-0"
                    >
                      <Plus className="h-4 w-4 mr-1 sm:mr-2" />
                      <span className="hidden xs:inline">Add to Shop</span>
                      <span className="xs:hidden">Add</span>
                    </Button>
                  </div>
                ))
              ) : searchQuery === "" ? (
                <p>Start your search</p>
              ) : (
                <div className="text-center py-8">
                  <p className="mb-4">No products found for "{searchQuery}".</p>
                  <Button
                    onClick={() => handleProductNotFound(searchQuery)}
                    variant="outline"
                    className="mx-auto"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add "{searchQuery}" as new product
                  </Button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Available Products Tab */}
      {activeTab === "availableProducts" && (
        <>
          <div className="mb-3 sm:mb-4">
            <Input
              placeholder="Search for a product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          
          {productsAtShopLoading && <p>Loading products...</p>}
          {productsAtShopError && <p className="text-red-500">Error loading products: {productsAtShopError}</p>}
          
          {!productsAtShopLoading && (
            <div className="space-y-2 sm:space-y-4">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <ProductAtShopCard
                    key={product.productId}
                    productId={product.productId}
                    shopId={product.shopId}
                    title={product.title}
                    caseSize={product.caseSize}
                    packetSize={product.packetSize}
                    retailSize={product.retailSize}
                    barcode={product.barcode}
                    caseBarcode={product.caseBarcode}
                    img={product.img}
                    price={Number(product.price)}
                    offerPrice={product.offerPrice ? Number(product.offerPrice) : undefined}
                    offerExpiryDate={product.offerExpiryDate}
                    aiel={product.aiel}
                    rrp={Number(product.rrp)}
                    onPriceUpdate={handlePriceUpdate}
                    onOfferUpdate={handleOfferUpdate}
                  />
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
                  src={getImageUrl(selectedProduct.img)}
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
                  <BarcodeScanner
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

      {/* Product Not Found Dialog */}
      <Dialog open={showProductNotFoundDialog} onOpenChange={setShowProductNotFoundDialog}>
        <DialogContent className="w-[95vw] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>Product Not Found</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4">
              Product with name "{notFoundProductName}" does not exist in our database.
            </p>
            <p className="mb-6">Do you want to add it as a new product?</p>
            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                onClick={() => setShowProductNotFoundDialog(false)}
              >
                No
              </Button>
              <Button onClick={confirmAddNewProduct}>
                Yes, Add Product
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShopDetail;
