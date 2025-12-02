


import { useState, useRef, useEffect } from "react";
import { ProductCard } from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, PlusCircle, Barcode, Upload, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import useFetchProducts from "@/hooks/useFetchProducts";
import BarcodeScannerComponent from "react-qr-barcode-scanner";

const Products = () => {
  // Use search params for persistent filters
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize state from URL or default
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || "");
  const [filters, setFilters] = useState({
    withoutBarcode: searchParams.get('withoutBarcode') === 'true',
    withoutCaseBarcode: searchParams.get('withoutCaseBarcode') === 'true',
    withoutRrp: searchParams.get('withoutRrp') === 'true',
    withoutImage: searchParams.get('withoutImage') === 'true',
  });
  
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get('page') || '1', 10)
  );
  const [itemsPerPage] = useState(10);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isAddScannerOpen, setIsAddScannerOpen] = useState(false);
  
  // State for adding a new product
  const [addBarcode, setAddBarcode] = useState<string>("");
  const [productName, setProductName] = useState<string>("");
  const [caseSize, setCaseSize] = useState<string>("");
  const [packetSize, setPacketSize] = useState<string>("");
  const [retailSize, setRetailSize] = useState<string>("");
  const [rrp, setRrp] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Update search params whenever filters or search changes
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (searchQuery) params.set('search', searchQuery);
    if (currentPage > 1) params.set('page', currentPage.toString());
    
    // Add filters to URL
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, 'true');
    });

    setSearchParams(params);
  }, [searchQuery, filters, currentPage]);

  // Updated hook to use filters and pagination
  const { products, loading, error, pagination } = useFetchProducts(
    searchQuery, 
    filters, 
    currentPage, 
    itemsPerPage
  );

  // Handle scanning for navigation
  const handleScanForNavigation = (err: any, result: any) => {
    if (result) {
      setIsScannerOpen(false);
      navigate(`/product/${result.text}`);
    }
  };

  // Handle scanning for adding a product
  const handleScanForAddProduct = (err: any, result: any) => {
    if (result) {
      setIsAddScannerOpen(false);
      setAddBarcode(result.text);
    }
  };

  // Toggle filter status
  const toggleFilter = (filterName: keyof typeof filters) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: !prev[filterName],
    }));
  };

  // Handle applying filters
  const applyFilters = () => {
    setIsFilterDialogOpen(false);
    setCurrentPage(1); // Reset to first page when applying new filters
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      withoutBarcode: false,
      withoutCaseBarcode: false,
      withoutRrp: false,
      withoutImage: false,
    });
    setCurrentPage(1); // Reset to first page
    setSearchQuery(''); // Clear search query
  };

  // Calculate active filters count
  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  // Pagination handlers
  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0); // Scroll to top when changing page
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < pagination.totalPages) {
      goToPage(currentPage + 1);
    }
  };

  // Generate page numbers
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5; // Show max 5 page numbers
    
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(pagination.totalPages, startPage + maxPagesToShow - 1);
    
    // Adjust startPage if endPage is at max
    if (endPage === pagination.totalPages) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    return pageNumbers;
  };

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Trigger file input click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!addBarcode || !productName || !packetSize) {
      alert("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("title", productName);
      formData.append("rrp", rrp);
      formData.append("caseSize", caseSize);
      formData.append("packetSize", packetSize);
      formData.append("retailSize", retailSize);
      formData.append("barcode", addBarcode);
      
      if (selectedImage) {
        formData.append("image", selectedImage);
      }
      const authToken = localStorage.getItem("auth_token");
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api"}/addproduct`, {
        method: "POST",
        body: formData,
        headers: {
          ...(authToken && { Authorization: `Bearer ${authToken}` }),
        },
         credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add product");
      }

      // Reset form after successful submission
      setAddBarcode("");
      setProductName("");
      setCaseSize("");
      setPacketSize("");
      setRetailSize("");
      setRrp("");
      setSelectedImage(null);
      setImagePreview(null);
      
      // Refresh products list or navigate
      alert("Product added successfully!");
    } catch (error) {
      console.error("Error adding product:", error);
      console.log(error);
      alert(error instanceof Error ? error.message : "Failed to add product");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container py-4 md:py-8 mx-auto px-4">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold mb-1 md:mb-2">Products</h1>
            <p className="text-sm text-muted-foreground">
              Browse and manage your product inventory
            </p>
          </div>

          {/* Add Product Modal */}
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full md:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-md mx-auto">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="Product Name"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                  />
                  <div className="relative">
                    <Input
                      placeholder="Barcode"
                      value={addBarcode}
                      onChange={(e) => setAddBarcode(e.target.value)}
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute right-1 top-1/2 -translate-y-1/2"
                      onClick={() => setIsAddScannerOpen(true)}
                    >
                      <Barcode className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    placeholder="Case Size"
                    value={caseSize}
                    onChange={(e) => setCaseSize(e.target.value)}
                  />
                  <Input
                    placeholder="Packet Size"
                    value={packetSize}
                    onChange={(e) => setPacketSize(e.target.value)}
                  />
                  <Input
                    placeholder="Retail Size"
                    value={retailSize}
                    onChange={(e) => setRetailSize(e.target.value)}
                  />
                  <Input
                    placeholder="RRP"
                    value={rrp}
                    onChange={(e) => setRrp(e.target.value)}
                  />
                </div>

                {/* Image Upload */}
                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <Button 
                    variant="outline" 
                    onClick={handleUploadClick}
                    className="w-full"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {selectedImage ? 'Change Image' : 'Upload Image'}
                  </Button>
                </div>

                {imagePreview && (
                  <div className="mt-2 flex justify-center">
                    <img 
                      src={imagePreview} 
                      alt="Product Preview" 
                      className="max-h-40 max-w-full object-contain rounded"
                    />
                  </div>
                )}

                <Button 
                  className="w-full" 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Adding..." : "Add Product"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search Bar with Barcode Scanner and Filter */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              className="pl-10 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button 
            variant="outline" 
            onClick={() => setIsScannerOpen(true)}
            className="md:w-auto"
          >
            <Barcode className="mr-2 h-5 w-5" />
            Scan
          </Button>
          <Button 
            variant={activeFiltersCount > 0 ? "default" : "outline"}
            onClick={() => setIsFilterDialogOpen(true)}
            className="md:w-auto relative"
          >
            <Filter className="mr-2 h-5 w-5" />
            Filter
            {activeFiltersCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
                {activeFiltersCount}
              </span>
            )}
          </Button>
        </div>

        {/* Active Filters Summary */}
        {activeFiltersCount > 0 && (
          <div className="bg-muted p-2 rounded-md flex flex-wrap gap-2 items-center text-sm">
            <span className="font-medium">Active filters:</span>
            {filters.withoutBarcode && (
              <span className="bg-primary/10 text-primary px-2 py-1 rounded-md">Without barcode</span>
            )}
            {filters.withoutCaseBarcode && (
              <span className="bg-primary/10 text-primary px-2 py-1 rounded-md">Without case barcode</span>
            )}
            {filters.withoutRrp && (
              <span className="bg-primary/10 text-primary px-2 py-1 rounded-md">Without RRP</span>
            )}
            {filters.withoutImage && (
              <span className="bg-primary/10 text-primary px-2 py-1 rounded-md">Without image</span>
            )}
            <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto">
              Clear all
            </Button>
          </div>
        )}

        {/* Display Products */}
        <div className="flex flex-col space-y-4">
          {loading && <p className="text-center py-4">Loading...</p>}
          {error && <p className="text-red-500 text-center py-4">{error}</p>}
          {products.length === 0 && !loading && !error && (
            <p className="text-center py-8 text-muted-foreground">No products found</p>
          )}
          {products.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>

       {/* Pagination Controls */}
       {pagination.totalPages > 1 && (
          <div className="flex justify-center items-center space-x-1 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevPage}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            {getPageNumbers().map(pageNum => (
              <Button
                key={pageNum}
                variant={pageNum === currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => goToPage(pageNum)}
                className="w-8 h-8 p-0"
              >
                {pageNum}
              </Button>
            ))}
            
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={currentPage === pagination.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        {/* Pagination Summary */}
        {pagination.total > 0 && (
          <div className="text-center text-sm text-muted-foreground">
            Showing {((currentPage - 1) * pagination.limit) + 1} to {Math.min(currentPage * pagination.limit, pagination.total)} of {pagination.total} products
          </div>
        )}
      </div>

      {/* Barcode Scanner Modal for Navigation */}
      {isScannerOpen && (
        <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
          <DialogContent className="flex flex-col items-center w-[95vw] max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle>Scan Barcode</DialogTitle>
            </DialogHeader>
            <div className="w-full max-w-full overflow-hidden">
              <BarcodeScannerComponent
                width="100%"
                height={250}
                onUpdate={handleScanForNavigation}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Barcode Scanner Modal for Add Product */}
      {isAddScannerOpen && (
        <Dialog open={isAddScannerOpen} onOpenChange={setIsAddScannerOpen}>
          <DialogContent className="flex flex-col items-center w-[95vw] max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle>Scan Barcode</DialogTitle>
            </DialogHeader>
            <div className="w-full max-w-full overflow-hidden">
              <BarcodeScannerComponent
                width="100%"
                height={250}
                onUpdate={handleScanForAddProduct}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Filter Dialog */}
      <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
        <DialogContent className="w-[95vw] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>Filter Products</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="withoutBarcode" 
                  checked={filters.withoutBarcode}
                  onCheckedChange={() => toggleFilter('withoutBarcode')}
                />
                <label 
                  htmlFor="withoutBarcode" 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Products without barcode
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="withoutCaseBarcode" 
                  checked={filters.withoutCaseBarcode}
                  onCheckedChange={() => toggleFilter('withoutCaseBarcode')}
                />
                <label 
                  htmlFor="withoutCaseBarcode" 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Products without case barcode
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="withoutRrp" 
                  checked={filters.withoutRrp}
                  onCheckedChange={() => toggleFilter('withoutRrp')}
                />
                <label 
                  htmlFor="withoutRrp" 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Products without RRP
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="withoutImage" 
                  checked={filters.withoutImage}
                  onCheckedChange={() => toggleFilter('withoutImage')}
                />
                <label 
                  htmlFor="withoutImage" 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Products without images
                </label>
              </div>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={clearFilters} className="w-full sm:w-auto">
              Clear Filters
            </Button>
            <Button onClick={applyFilters} className="w-full sm:w-auto">
              Apply Filters
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Products;
