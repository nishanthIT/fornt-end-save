





import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Store, Phone, MapPin, Plus, Save, PlusCircle, Barcode, Search, Camera, Upload, X, Gift } from "lucide-react";
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
import { OptimizedScanner } from "@/components/OptimizedScanner";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { getImageUrl } from "@/utils/imageUtils";
import { CategorySelect } from "@/components/CategorySelect";
import { BundlePromotionDialog } from "@/components/BundlePromotionDialog";

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
  const [category, setCategory] = useState("");
  const [image, setImage] = useState(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageName, setImageName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showProductBarcodeScanner, setShowProductBarcodeScanner] = useState(false);
  
  // UI states
  const [activeTab, setActiveTab] = useState("availableProducts");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filter states for Available Products tab
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterAisle, setFilterAisle] = useState<string>("");
  const [filterStockStatus, setFilterStockStatus] = useState<string>("");
  const [availableProductsSearch, setAvailableProductsSearch] = useState<string>("");
  const [availableProductsPage, setAvailableProductsPage] = useState<number>(1);
  
  // Shop filters (categories and aisles from API)
  const [shopCategories, setShopCategories] = useState<string[]>([]);
  const [shopAisles, setShopAisles] = useState<string[]>([]);
  
  // Selected product for addition
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showAddProductDialog, setShowAddProductDialog] = useState(false);
  const [addProductCaseBarcode, setAddProductCaseBarcode] = useState("");
  const [addProductPrice, setAddProductPrice] = useState("");
  const [addProductAiel, setAddProductAiel] = useState("");
  const [addProductRrp, setAddProductRrp] = useState("");
  const [addProductcaseSize , setAddProductcaseSize ] = useState("");
  const [addProductpacketSize, setAddProductpacketSize] = useState("");
  const [addProductCategory, setAddProductCategory] = useState("");
  const [addProductImage, setAddProductImage] = useState<string | null>(null);
  const [addProductImageFile, setAddProductImageFile] = useState<File | null>(null);
  const [showAddProductScanner, setShowAddProductScanner] = useState(false);
  const [showProductNotFoundDialog, setShowProductNotFoundDialog] = useState(false);
  const [notFoundProductName, setNotFoundProductName] = useState("");
  const [showSearchScanner, setShowSearchScanner] = useState(false);
  const [isSearchingBarcode, setIsSearchingBarcode] = useState(false);
  
  // Force refresh state
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Bundle promotion dialog state
  const [showBundlePromotionDialog, setShowBundlePromotionDialog] = useState(false);

  // Bulk selection + bulk price edit state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [showBulkPriceDialog, setShowBulkPriceDialog] = useState(false);
  const [bulkEditType, setBulkEditType] = useState<"fixed" | "increase" | "decrease">("fixed");
  const [bulkEditValue, setBulkEditValue] = useState("");
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  // Ref to store scroll position for restoration after product updates
  const savedScrollPositionRef = useRef<number | null>(null);
  // Flag to indicate we're doing a product update (not initial load)
  const isUpdatingRef = useRef<boolean>(false);

  // Save current scroll position before updates
  const saveScrollPosition = useCallback(() => {
    savedScrollPositionRef.current = window.scrollY;
    isUpdatingRef.current = true;
    console.log('Saved scroll position:', savedScrollPositionRef.current);
  }, []);

  // Restore scroll position after updates - try multiple times to ensure it works
  const restoreScrollPosition = useCallback(() => {
    if (savedScrollPositionRef.current !== null && isUpdatingRef.current) {
      const targetScroll = savedScrollPositionRef.current;
      console.log('Restoring scroll position to:', targetScroll);
      
      // Try restoring multiple times to handle async DOM updates
      const restore = () => {
        window.scrollTo(0, targetScroll);
      };
      
      // Immediate restore
      restore();
      // After paint
      requestAnimationFrame(restore);
      // After a short delay (for any async rendering)
      setTimeout(restore, 50);
      setTimeout(restore, 100);
      setTimeout(() => {
        restore();
        savedScrollPositionRef.current = null;
        isUpdatingRef.current = false;
      }, 200);
    }
  }, []);

  // Helper function to format price input (456 -> 4.56, 45 -> 0.45, 1 -> 0.01)
  const formatPriceInput = (value: string): string => {
    // Remove any non-digit characters
    const digits = value.replace(/\D/g, '');
    if (!digits) return '';
    
    // Convert to number and divide by 100 to get pounds
    const pence = parseInt(digits, 10);
    const pounds = (pence / 100).toFixed(2);
    return pounds;
  };

  // Handle price input change - stores raw digits, displays formatted
  const handlePriceChange = (value: string, setter: (val: string) => void) => {
    // If user is typing, just store the raw input temporarily
    // Remove any non-digit characters except decimal point
    const cleanValue = value.replace(/[^0-9]/g, '');
    const formatted = formatPriceInput(cleanValue);
    setter(formatted);
  };

  // Image compression function for camera captures
  const compressImage = (file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.8): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }
      
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              console.log(`Compressed image from ${(file.size / 1024 / 1024).toFixed(2)}MB to ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => {
        resolve(file); // Return original file if compression fails
      };
      
      img.src = URL.createObjectURL(file);
    });
  };
  
  // Use the custom hooks to fetch products
  const { products: fetchedProducts, loading, error } = useFetchProducts(searchQuery);
  const { 
    products: productsAtShop, 
    loading: productsAtShopLoading, 
    error: productsAtShopError,
    pagination: productsAtShopPagination,
    refetch: refetchProductsAtShop,
    silentRefetch: silentRefetchProductsAtShop 
  } = useFetchProductsAtShop(id, refreshTrigger, {
    page: availableProductsPage,
    search: availableProductsSearch,
    category: filterCategory,
    aisle: filterAisle,
    stockStatus: filterStockStatus
  });
  const { shop, loading: shopLoading, error: shopError } = useFetchShopById(id);

  const [products, setProducts] = useState([]);

  // Update a single product locally without refetching (preserves scroll position)
  const updateProductLocally = useCallback((productId: string, updates: Partial<any>) => {
    setProducts(prevProducts => 
      prevProducts.map(p => 
        p.productId === productId ? { ...p, ...updates } : p
      )
    );
  }, []);

  useEffect(() => {
    if (productsAtShop && Array.isArray(productsAtShop)) {
      setProducts(productsAtShop);
      // Restore scroll position after products update (only for refetch scenarios)
      restoreScrollPosition();
    }
  }, [productsAtShop, restoreScrollPosition]);

  // Fetch shop categories and aisles
  useEffect(() => {
    const fetchShopFilters = async () => {
      if (!id) return;
      try {
        const auth_token = localStorage.getItem('auth_token');
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api"}/shop/${id}/filters`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...(auth_token && { Authorization: `Bearer ${auth_token}` }),
            },
            credentials: 'include'
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          setShopCategories(data.categories || []);
          setShopAisles(data.aisles || []);
        }
      } catch (error) {
        console.error("Error fetching shop filters:", error);
      }
    };
    
    fetchShopFilters();
  }, [id, refreshTrigger]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(URL.createObjectURL(file));
      setImageFile(file);
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

    // Show uploading toast for long operations (especially with image)
    const hasImage = !!imageFile;
    const uploadingToast = toast.loading(hasImage ? "Adding product with image..." : "Adding product...");
    
    // Capture all form data before resetting
    const formData = new FormData();
    formData.append('shopId', shopId);
    formData.append('title', title);
    formData.append('employeeId', String(employeeId));
    formData.append('caseSize', finalCaseSize);
    formData.append('packetSize', finalPacketSize);
    if (retailSize) formData.append('retailSize', retailSize);
    if (barcode) formData.append('barcode', barcode);
    if (caseBarcode) formData.append('casebarcode', caseBarcode);
    if (price) formData.append('price', String(parseFloat(price) || 0));
    if (Aiel) formData.append('aiel', Aiel);
    if (finalRrp) formData.append('rrp', String(parseFloat(finalRrp) || 0));
    if (category) formData.append('category', category);
    if (imageFile) formData.append('image', imageFile);
    
    // Reset form immediately so user can continue
    setTitle("");
    setCaseSize("1");
    setPacketSize("1");
    setRetailSize("");
    setPrice("");
    setAiel("");
    setRrp("");
    setCategory("");
    setCaseBarcode("");
    setBarcode("");
    setImage(null);
    setImageFile(null);
    setImageName("");

    // Run upload in background
    try {
      const authToken = localStorage.getItem("auth_token");

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api"}/addProductAtShop`, {
        method: "POST",
        headers: {
          ...(authToken && { Authorization: `Bearer ${authToken}` }),
        },
        body: formData,
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (response.ok) {
        toast.dismiss(uploadingToast);
        toast.success("Product added successfully!");
        
        // Trigger a refresh of products
        setRefreshTrigger(prev => prev + 1);
        await refetchProductsAtShop();
      } else {
        toast.dismiss(uploadingToast);
        toast.warning(`Error: ${result.error}`);
      }
    } catch (error: any) {
      console.error("Product add error:", error);
      const errorMsg = error?.message || "Unknown error";
      toast.dismiss(uploadingToast);
      toast.warning(`Error: ${errorMsg}`);
    }
  };

  // Function to handle barcode scan in search tab
  const handleSearchBarcodeScan = async (scannedBarcode: string) => {
    setShowSearchScanner(false);
    setIsSearchingBarcode(true);
    
    try {
      const authToken = localStorage.getItem("auth_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api"}/getProductByBarcode/${scannedBarcode}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(authToken && { Authorization: `Bearer ${authToken}` }),
          },
          credentials: 'include'
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          // Product found - open the add product dialog
          toast.success(`Product found: ${result.data.title}`);
          openAddProductDialog(result.data);
        }
      } else if (response.status === 404) {
        // Product not found - automatically open add new product dialog
        toast.info("Product not found - Add it as a new product");
        setBarcode(scannedBarcode); // Pre-fill the barcode for new product
        // Automatically open the add new product dialog
        (document.querySelector('[data-trigger="add-new-product"]') as HTMLElement)?.click();
      } else {
        toast.error("Error searching for product");
      }
    } catch (error) {
      console.error("Error searching by barcode:", error);
      toast.error("Error searching for product");
    } finally {
      setIsSearchingBarcode(false);
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
    setAddProductCategory(product.category || "");
    // Properly clear image state - revoke old URL to prevent memory leaks
    if (addProductImage) {
      URL.revokeObjectURL(addProductImage);
    }
    // Clear image states so previous product's photo doesn't show
    setAddProductImage(null);
    setAddProductImageFile(null);
    setShowAddProductDialog(true);
  };

  // Function to show product not found dialog
  const handleProductNotFound = (productName: string) => {
    setNotFoundProductName(productName);
    setShowProductNotFoundDialog(true);
  };

  // Function to confirm adding new product
  const confirmAddNewProduct = () => {
    // Check if notFoundProductName looks like a barcode (all digits)
    const isBarcode = /^\d+$/.test(notFoundProductName);
    if (isBarcode) {
      setBarcode(notFoundProductName);
      setTitle(""); // Don't set barcode as title
    } else {
      setTitle(notFoundProductName);
    }
    setShowProductNotFoundDialog(false);
    // Trigger the add product dialog
    (document.querySelector('[data-trigger="add-new-product"]') as HTMLElement)?.click();
  };

  // Function to add existing product from search
  const handleAddExistingProduct = async () => {
    if (!selectedProduct) {
      toast.error("No product selected");
      return;
    }
    
    if (!shopId) {
      toast.error("Shop ID is missing");
      return;
    }
    
    console.log("Adding product:", { shopId, productId: selectedProduct.id, employeeId });
    
    // Close dialog immediately
    setShowAddProductDialog(false);
    
    // Show uploading toast for long operations
    const hasImage = !!addProductImageFile;
    const uploadingToast = toast.loading(hasImage ? "Adding product with image..." : "Adding product to shop...");
    
    // Capture all values before resetting
    const capturedSelectedProduct = selectedProduct;
    const capturedAddProductImageFile = addProductImageFile;
    const capturedAddProductCaseBarcode = addProductCaseBarcode;
    const capturedAddProductPrice = addProductPrice;
    const capturedAddProductAiel = addProductAiel;
    const capturedAddProductpacketSize = addProductpacketSize;
    const capturedAddProductcaseSize = addProductcaseSize;
    const capturedAddProductCategory = addProductCategory;
    const capturedAddProductRrp = addProductRrp;
    const finalRrp = capturedAddProductRrp || capturedAddProductPrice;
    
    // Reset image state
    if (addProductImage) URL.revokeObjectURL(addProductImage);
    setAddProductImage(null);
    setAddProductImageFile(null);
    
    try {
      const authToken = localStorage.getItem("auth_token");
      
      // If we have an image file, use FormData
      if (capturedAddProductImageFile) {
        const formData = new FormData();
        formData.append('shopId', shopId);
        formData.append('id', capturedSelectedProduct.id);
        if (employeeId) formData.append('employeeId', String(employeeId));
        if (capturedAddProductCaseBarcode) formData.append('casebarcode', capturedAddProductCaseBarcode);
        if (capturedAddProductPrice) formData.append('price', String(parseFloat(capturedAddProductPrice) || 0));
        if (capturedAddProductAiel) formData.append('aiel', capturedAddProductAiel);
        if (finalRrp) formData.append('rrp', String(parseFloat(finalRrp) || 0));
        if (capturedAddProductpacketSize) formData.append('packetSize', capturedAddProductpacketSize);
        if (capturedAddProductcaseSize) formData.append('caseSize', capturedAddProductcaseSize);
        if (capturedAddProductCategory) formData.append('category', capturedAddProductCategory);
        formData.append('image', capturedAddProductImageFile);
        
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api"}/addProductAtShopifExistAtProduct`, {
          method: "POST",
          headers: {
            ...(authToken && { Authorization: `Bearer ${authToken}` }),
          },
          body: formData,
          credentials: 'include'
        });

        const result = await response.json();

        if (response.ok) {
          toast.dismiss(uploadingToast);
          toast.success("Product added to shop successfully!");
          setRefreshTrigger(prev => prev + 1);
          await refetchProductsAtShop();
        } else {
          toast.dismiss(uploadingToast);
          toast.warning(`Error: ${result.error}`);
        }
      } else {
        // No image, use JSON
        const productData = {
          shopId,
          id: capturedSelectedProduct.id,
          ...(employeeId && { employeeId }),
          ...(capturedAddProductCaseBarcode && { casebarcode: capturedAddProductCaseBarcode }),
          ...(capturedAddProductPrice && { price: parseFloat(capturedAddProductPrice) || 0 }),
          ...(capturedAddProductAiel && { aiel: capturedAddProductAiel }),
          ...(finalRrp && { rrp: parseFloat(finalRrp) || 0 }),
          ...(capturedAddProductpacketSize && { packetSize: capturedAddProductpacketSize }),
          ...(capturedAddProductcaseSize && { caseSize: capturedAddProductcaseSize }),
          ...(capturedAddProductCategory && { category: capturedAddProductCategory })
        };
        
        console.log("Sending product data:", productData);

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
          toast.dismiss(uploadingToast);
          toast.success("Product added to shop successfully!");
          setRefreshTrigger(prev => prev + 1);
          await refetchProductsAtShop();
        } else {
          toast.dismiss(uploadingToast);
          toast.warning(`Error: ${result.error}`);
        }
      }
    } catch (error) {
      console.error(error);
      toast.dismiss(uploadingToast);
      toast.warning("An error occurred. Please try again later.");
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
        // Update product locally to preserve scroll position (no refetch)
        updateProductLocally(productId, {
          price: newPrice,
          offerPrice: offerPrice,
          offerExpiryDate: offerExpiryDate
        });
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

  const startSelectionMode = (productId: string) => {
    setIsSelectionMode(true);
    setSelectedProductIds((prev) => (prev.includes(productId) ? prev : [...prev, productId]));
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const cancelSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedProductIds([]);
    setShowBulkPriceDialog(false);
  };

  const toggleSelectAllVisible = () => {
    const visibleIds = (products || []).map((product) => product.productId);
    if (visibleIds.length === 0) return;

    const allVisibleSelected = visibleIds.every((id) => selectedProductIds.includes(id));

    if (allVisibleSelected) {
      setSelectedProductIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
      return;
    }

    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      visibleIds.forEach((id) => next.add(id));
      return Array.from(next);
    });
  };

  const applyBulkPriceUpdates = async () => {
    if (!id || selectedProductIds.length === 0) {
      toast.error("Select at least one product");
      return;
    }

    const numericValue = Number.parseFloat(bulkEditValue);
    if (Number.isNaN(numericValue) || numericValue <= 0) {
      toast.error(bulkEditType === "fixed" ? "Enter a valid new price" : "Enter a valid percentage");
      return;
    }
    if (bulkEditType === "decrease" && numericValue >= 100) {
      toast.error("Percentage decrease must be less than 100");
      return;
    }

    const selectedProducts = (products || []).filter((product) => selectedProductIds.includes(product.productId));
    if (selectedProducts.length === 0) {
      toast.error("No selected products found on this page");
      return;
    }

    const calculatePrice = (currentPrice: number) => {
      if (bulkEditType === "fixed") {
        return Number(numericValue.toFixed(2));
      }
      const multiplier = bulkEditType === "increase"
        ? 1 + numericValue / 100
        : 1 - numericValue / 100;
      return Number(Math.max(0.01, currentPrice * multiplier).toFixed(2));
    };

    setIsBulkUpdating(true);
    const authToken = localStorage.getItem("auth_token");

    try {
      const results = await Promise.all(
        selectedProducts.map(async (product) => {
          const nextPrice = calculatePrice(Number(product.price));
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api"}/shop/${id}/updateProductPrice`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              ...(authToken && { Authorization: `Bearer ${authToken}` }),
            },
            body: JSON.stringify({
              productId: product.productId,
              price: nextPrice,
              employeeId,
            }),
            credentials: "include",
          });

          if (!response.ok) {
            const errorPayload = await response.json().catch(() => ({}));
            return {
              ok: false,
              productId: product.productId,
              title: product.title,
              error: errorPayload.error || "Update failed",
            };
          }

          return {
            ok: true,
            productId: product.productId,
            nextPrice,
          };
        })
      );

      const successful = results.filter((result) => result.ok) as Array<{ ok: true; productId: string; nextPrice: number }>;
      const failed = results.filter((result) => !result.ok) as Array<{ ok: false; title: string; error: string }>;

      successful.forEach((item) => {
        updateProductLocally(item.productId, { price: item.nextPrice });
      });

      if (successful.length > 0) {
        toast.success(`Updated ${successful.length} product${successful.length > 1 ? "s" : ""} successfully`);
      }
      if (failed.length > 0) {
        toast.warning(`Failed to update ${failed.length} product${failed.length > 1 ? "s" : ""}`);
      }

      if (successful.length > 0) {
        setShowBulkPriceDialog(false);
        setBulkEditValue("");
        setSelectedProductIds([]);
        setIsSelectionMode(false);
      }
    } catch (error) {
      console.error("Bulk price update error:", error);
      toast.error("Bulk update failed. Please try again.");
    } finally {
      setIsBulkUpdating(false);
    }
  };

  // Handle out of stock toggle
  const handleOutOfStockToggle = async (productId: string, outOfStock: boolean) => {
    try {
      const auth_token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api"}/shop/${id}/product/${productId}/stock`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(auth_token && { Authorization: `Bearer ${auth_token}` }),
          },
          body: JSON.stringify({ outOfStock }),
          credentials: 'include'
        }
      );
      
      if (response.ok) {
        toast.success(outOfStock ? "Product marked as out of stock" : "Product marked as in stock");
        // Update product locally to preserve scroll position
        updateProductLocally(productId, { outOfStock });
      } else {
        toast.error("Failed to update stock status");
      }
    } catch (error) {
      console.error("Error updating stock status:", error);
      toast.error("Error updating stock status");
    }
  };

  // Handle remove product from shop
  const handleRemoveProduct = async (productId: string) => {
    try {
      const auth_token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api"}/shop/${id}/product`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...(auth_token && { Authorization: `Bearer ${auth_token}` }),
          },
          body: JSON.stringify({ productId, employeeId: user?.id }),
          credentials: 'include'
        }
      );
      
      if (response.ok) {
        toast.success("Product removed from shop");
        silentRefetchProductsAtShop();
      } else {
        toast.error("Failed to remove product from shop");
      }
    } catch (error) {
      console.error("Error removing product:", error);
      toast.error("Error removing product");
    }
  };

  // Reset pagination when filters change
  useEffect(() => {
    setAvailableProductsPage(1);
  }, [availableProductsSearch, filterCategory, filterAisle, filterStockStatus]);

  // Products are already filtered by API, no need for client-side filtering
  // Keep this for backward compatibility with other UI parts that might use it
  const filteredProducts = products || [];
  const allVisibleSelected =
    filteredProducts.length > 0 &&
    filteredProducts.every((product) => selectedProductIds.includes(product.productId));

  useEffect(() => {
    setSelectedProductIds((prev) => {
      const existing = new Set((products || []).map((product) => product.productId));
      return prev.filter((id) => existing.has(id));
    });
  }, [products]);

  useEffect(() => {
    cancelSelectionMode();
  }, [availableProductsPage, availableProductsSearch, filterCategory, filterAisle, filterStockStatus]);

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

            <div className="flex gap-2 flex-wrap">
              {/* Bundle Promotions Button */}
              <Button 
                size="sm" 
                variant="outline"
                className="flex-shrink-0" 
                onClick={() => setShowBundlePromotionDialog(true)}
              >
                <Gift className="mr-1 sm:mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Bundle Offers</span>
                <span className="sm:hidden">Bundles</span>
              </Button>

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
                  {/* Product Barcode - Required with Scanner */}
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <Button className="flex-shrink-0" variant="outline" onClick={() => setShowProductBarcodeScanner(!showProductBarcodeScanner)}>
                        <Barcode className="mr-2 h-4 w-4" />
                        {showProductBarcodeScanner ? "Close" : "Scan"}
                      </Button>
                      <Input 
                        type="text" 
                        placeholder="Product Barcode *" 
                        value={barcode} 
                        onChange={(e) => setBarcode(e.target.value)} 
                        className="flex-1"
                      />
                    </div>
                    {showProductBarcodeScanner && (
                      <div className="border rounded-lg p-2">
                        <OptimizedScanner
                          width={300}
                          height={200}
                          onScan={(result) => {
                            setBarcode(result);
                            setShowProductBarcodeScanner(false);
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Title - Required */}
                  <Input placeholder="Product Name *" value={title} onChange={(e) => setTitle(e.target.value)} />

                  {/* Case Barcode Scanner */}
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <Button className="flex-shrink-0" variant="outline" onClick={() => setShowScanner(!showScanner)}>
                        <Barcode className="mr-2 h-4 w-4" />
                        {showScanner ? "Close" : "Scan"}
                      </Button>
                      <Input
                        type="text"
                        placeholder="Case Barcode"
                        value={caseBarcode}
                        onChange={(e) => setCaseBarcode(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                    {showScanner && (
                      <div className="border rounded-lg p-2">
                        <OptimizedScanner
                          width={300}
                          height={200}
                          onScan={(result) => {
                            setCaseBarcode(result);
                            setShowScanner(false);
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Case Size */}
                  <div className="space-y-1">
                    <label className="text-sm text-muted-foreground">Case Size (default: 1)</label>
                    <Input type="text" placeholder="Enter Case Size" value={caseSize} onChange={(e) => setCaseSize(e.target.value)} />
                  </div>

                  {/* Packet Size */}
                  <div className="space-y-1">
                    <label className="text-sm text-muted-foreground">Packet Size (default: 1)</label>
                    <Input type="text" placeholder="Enter Packet Size" value={packetSize} onChange={(e) => setPacketSize(e.target.value)} />
                  </div>

                  {/* Retail Size hidden per client request */}

                  {/* Price */}
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
                    <Input 
                      type="text" 
                      placeholder="Price (e.g. 456 = £4.56)" 
                      value={price} 
                      onChange={(e) => handlePriceChange(e.target.value, setPrice)}
                      className="pl-7"
                    />
                  </div>

                  {/* Aisle No */}
                  <Input type="text" placeholder="Aisle No" value={Aiel} onChange={(e) => setAiel(e.target.value)} />

                  {/* RRP */}
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
                    <Input 
                      type="text" 
                      placeholder="RRP (e.g. 599 = £5.99)" 
                      value={rrp} 
                      onChange={(e) => handlePriceChange(e.target.value, setRrp)}
                      className="pl-7"
                    />
                  </div>

                  {/* Category */}
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Category</label>
                    {/* Quick select grid chips - mobile friendly */}
                    <div className="flex flex-wrap gap-1.5">
                      {["Confectionery", "Crisps", "Soft Drinks", "Alcohol", "Grocery", "Pet Food", "Health & Beauty", "House Hold", "Hardware", "Medicines", "Cigarettes", "Single Spirits", "Cakes & Bread", "Chill Foods", "Frozen & Ice Cream"].map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setCategory(cat)}
                          className={`px-2 py-1 text-[10px] sm:text-xs rounded-full transition-colors ${
                            category === cat
                              ? "bg-blue-500 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Image Upload */}
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Product Image (optional)</label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="flex-1"
                      />
                    </div>
                    {image && (
                      <div className="mt-2 relative inline-block">
                        <img src={image} alt="Preview" className="w-20 h-20 object-cover rounded-md" />
                        <button
                          type="button"
                          onClick={() => {
                            setImage(null);
                            setImageFile(null);
                            setImageName("");
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <p className="text-xs text-muted-foreground mt-1">{imageName}</p>
                      </div>
                    )}
                  </div>

                  {/* Add Product Button */}
                  <Button 
                    className="w-full" 
                    type="submit"
                    disabled={isSubmitting || !barcode || !title}
                    onClick={handleAddProduct}
                  >
                    {isSubmitting ? "Adding Product..." : "Add Product"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            </div>
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
          <div className="mb-4 sm:mb-8 space-y-3">
            {/* Search Input with Scan Button */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  placeholder="Search by name or barcode..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-8"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Button 
                variant="outline" 
                onClick={() => setShowSearchScanner(!showSearchScanner)}
                className="flex-shrink-0"
                disabled={isSearchingBarcode}
              >
                <Barcode className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">{showSearchScanner ? "Close" : "Scan"}</span>
              </Button>
            </div>
            
            {/* Barcode Scanner */}
            {showSearchScanner && (
              <div className="border rounded-lg p-3 bg-muted/30">
                <p className="text-sm text-muted-foreground mb-2 text-center">Scan a product barcode to find and add it</p>
                <div className="flex justify-center">
                  <OptimizedScanner
                    width={300}
                    height={200}
                    onScan={handleSearchBarcodeScan}
                  />
                </div>
              </div>
            )}
            
            {/* Loading state for barcode search */}
            {isSearchingBarcode && (
              <div className="text-center py-4">
                <p className="text-muted-foreground">Searching for product...</p>
              </div>
            )}
          </div>
          {loading && <p>Loading...</p>}
          {error && <p className="text-red-500">{error}</p>}
          {!loading && !error && (
            <div className="space-y-3 sm:space-y-4">
              {fetchedProducts && fetchedProducts.length > 0 ? (
                fetchedProducts.map((product) => {
                  // Check if product is already added to shop
                  const isAlreadyAdded = products?.some(
                    (p) => p.barcode === product.barcode || p.productId === product.id
                  );
                  
                  return (
                    <div key={product.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-3 sm:gap-4 ${isAlreadyAdded ? 'bg-green-50 border-green-200' : ''}`}>
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
                          </div>
                          {isAlreadyAdded && (
                            <span className="text-xs text-green-600 font-medium">✓ Already added to shop</span>
                          )}
                        </div>
                      </div>
                      {isAlreadyAdded ? (
                        <span className="text-sm text-green-600 font-medium px-3 py-1.5 bg-green-100 rounded-md">
                          Added
                        </span>
                      ) : (
                        <Button 
                          onClick={() => openAddProductDialog(product)}
                          size="sm"
                          className="w-full sm:w-auto flex-shrink-0"
                        >
                          <Plus className="h-4 w-4 mr-1 sm:mr-2" />
                          <span className="hidden xs:inline">Add to Shop</span>
                          <span className="xs:hidden">Add</span>
                        </Button>
                      )}
                    </div>
                  );
                })
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
          <div className="mb-3 sm:mb-4 space-y-3">
            {/* Search Input with Scan Button */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  placeholder="Search for a product..."
                  value={availableProductsSearch}
                  onChange={(e) => setAvailableProductsSearch(e.target.value)}
                  className="pr-8"
                />
                {availableProductsSearch && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => setAvailableProductsSearch("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setShowSearchScanner(!showSearchScanner)}
                className="flex-shrink-0"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>

            {/* Filter Options - Category, Aisle, and Stock Status */}
            <div className="flex flex-col sm:flex-row gap-2">
              {/* Category Filter */}
              <div className="flex-1">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full h-9 px-3 py-1.5 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="">All Categories</option>
                  {shopCategories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              {/* Aisle Filter */}
              <div className="flex-1">
                <select
                  value={filterAisle}
                  onChange={(e) => setFilterAisle(e.target.value)}
                  className="w-full h-9 px-3 py-1.5 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="">All Aisles</option>
                  {shopAisles.map((aisle) => (
                    <option key={aisle} value={aisle}>Aisle {aisle}</option>
                  ))}
                </select>
              </div>

              {/* Stock Status Filter */}
              <div className="flex-1">
                <select
                  value={filterStockStatus}
                  onChange={(e) => setFilterStockStatus(e.target.value)}
                  className="w-full h-9 px-3 py-1.5 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="">All Stock</option>
                  <option value="in-stock">In Stock</option>
                  <option value="out-of-stock">Out of Stock</option>
                </select>
              </div>

              {/* Clear Filters Button - show only when filters are active */}
              {(filterCategory || filterAisle || filterStockStatus || availableProductsSearch) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFilterCategory("");
                    setFilterAisle("");
                    setFilterStockStatus("");
                    setAvailableProductsSearch("");
                  }}
                  className="flex-shrink-0 text-xs sm:text-sm"
                >
                  <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>

            {/* Active Filters Summary */}
            {(filterCategory || filterAisle || filterStockStatus || availableProductsSearch) && (
              <div className="text-xs sm:text-sm text-muted-foreground">
                Showing {filteredProducts.length} of {productsAtShopPagination?.total || 0} products
                {filterCategory && <span className="ml-1">in <strong>{filterCategory}</strong></span>}
                {filterAisle && <span className="ml-1">in <strong>Aisle {filterAisle}</strong></span>}
                {filterStockStatus && <span className="ml-1">(<strong>{filterStockStatus === 'out-of-stock' ? 'Out of Stock' : 'In Stock'}</strong>)</span>}
                {availableProductsSearch && <span className="ml-1">matching <strong>"{availableProductsSearch}"</strong></span>}
              </div>
            )}
            
            {/* Scanner for search */}
            {showSearchScanner && (
              <div className="mt-2 rounded-lg overflow-hidden border">
                <OptimizedScanner
                  onScan={(result) => {
                    setAvailableProductsSearch(result);
                    setShowSearchScanner(false);
                    toast.success(`Barcode scanned: ${result}`);
                  }}
                  onError={(error) => {
                    console.error("Scanner error:", error);
                    toast.error("Scanner error. Please try again.");
                  }}
                  height={200}
                />
                <Button 
                  variant="ghost" 
                  className="w-full mt-1"
                  onClick={() => setShowSearchScanner(false)}
                >
                  Close Scanner
                </Button>
              </div>
            )}
          </div>
          
          {productsAtShopLoading && <p>Loading products...</p>}
          {productsAtShopError && <p className="text-red-500">Error loading products: {productsAtShopError}</p>}

          {isSelectionMode ? (
            <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-medium text-blue-900">
                  {selectedProductIds.length} item{selectedProductIds.length === 1 ? "" : "s"} selected
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={toggleSelectAllVisible}>
                    {allVisibleSelected ? "Unselect All" : "Select All"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setShowBulkPriceDialog(true)}
                    disabled={selectedProductIds.length === 0}
                  >
                    Edit Price
                  </Button>
                  <Button size="sm" variant="ghost" onClick={cancelSelectionMode}>
                    Cancel Selection
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <p className="mb-3 text-xs text-muted-foreground sm:text-sm">
              Long press any product card to enable multi-select and bulk price editing.
            </p>
          )}
          
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
                    category={product.category || ""}
                    price={Number(product.price)}
                    offerPrice={product.offerPrice ? Number(product.offerPrice) : undefined}
                    offerExpiryDate={product.offerExpiryDate}
                    aiel={product.aiel}
                    rrp={Number(product.rrp)}
                    outOfStock={product.outOfStock || false}
                    onPriceUpdate={handlePriceUpdate}
                    onOfferUpdate={handleOfferUpdate}
                    onProductUpdated={() => {
                      // For complex edits (edit dialog), do background refresh
                      // with scroll preservation
                      saveScrollPosition();
                      silentRefetchProductsAtShop();
                    }}
                    onOutOfStockToggle={handleOutOfStockToggle}
                    onRemove={handleRemoveProduct}
                    selectionMode={isSelectionMode}
                    isSelected={selectedProductIds.includes(product.productId)}
                    onToggleSelect={toggleProductSelection}
                    onStartSelection={startSelectionMode}
                  />
                ))
              ) : (
                <div>No products found. {availableProductsSearch || filterCategory || filterAisle || filterStockStatus ? "Try adjusting your search or filters." : "No products available in this shop yet."}</div>
              )}
            </div>
          )}
          
          {/* Pagination */}
          {productsAtShopPagination && productsAtShopPagination.totalPages > 1 && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                Page {productsAtShopPagination.page} of {productsAtShopPagination.totalPages} 
                ({productsAtShopPagination.total} total products)
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAvailableProductsPage(prev => Math.max(1, prev - 1))}
                  disabled={availableProductsPage <= 1 || productsAtShopLoading}
                >
                  Previous
                </Button>
                
                {/* Page numbers */}
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, productsAtShopPagination.totalPages) }, (_, i) => {
                    // Calculate which page numbers to show
                    let pageNum;
                    const totalPages = productsAtShopPagination.totalPages;
                    const currentPage = availableProductsPage;
                    
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => setAvailableProductsPage(pageNum)}
                        disabled={productsAtShopLoading}
                        className="min-w-[36px]"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAvailableProductsPage(prev => Math.min(productsAtShopPagination.totalPages, prev + 1))}
                  disabled={availableProductsPage >= productsAtShopPagination.totalPages || productsAtShopLoading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Bulk Price Edit Dialog */}
      <Dialog open={showBulkPriceDialog} onOpenChange={setShowBulkPriceDialog}>
        <DialogContent className="w-[95vw] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>Bulk Edit Price</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Apply changes to {selectedProductIds.length} selected item{selectedProductIds.length === 1 ? "" : "s"}.
            </p>

            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                size="sm"
                variant={bulkEditType === "fixed" ? "default" : "outline"}
                onClick={() => setBulkEditType("fixed")}
              >
                Same Price
              </Button>
              <Button
                type="button"
                size="sm"
                variant={bulkEditType === "increase" ? "default" : "outline"}
                onClick={() => setBulkEditType("increase")}
              >
                Increase %
              </Button>
              <Button
                type="button"
                size="sm"
                variant={bulkEditType === "decrease" ? "default" : "outline"}
                onClick={() => setBulkEditType("decrease")}
              >
                Decrease %
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {bulkEditType === "fixed" ? "New Price" : "Percentage"}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {bulkEditType === "fixed" ? "£" : "%"}
                </span>
                <Input
                  type={bulkEditType === "fixed" ? "text" : "number"}
                  inputMode={bulkEditType === "fixed" ? "numeric" : "decimal"}
                  min="0"
                  step={bulkEditType === "fixed" ? undefined : "0.1"}
                  value={bulkEditValue}
                  onChange={(e) => {
                    if (bulkEditType === "fixed") {
                      handlePriceChange(e.target.value, setBulkEditValue);
                      return;
                    }
                    setBulkEditValue(e.target.value);
                  }}
                  placeholder={bulkEditType === "fixed" ? "e.g. 2.49" : "e.g. 10"}
                  className="pl-7"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowBulkPriceDialog(false)}
                disabled={isBulkUpdating}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1"
                onClick={applyBulkPriceUpdates}
                disabled={isBulkUpdating || selectedProductIds.length === 0}
              >
                {isBulkUpdating ? "Updating..." : "Apply Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog for adding existing product with details */}
      <Dialog open={showAddProductDialog} onOpenChange={(open) => {
          setShowAddProductDialog(open);
          if (!open) {
            // Clear image states when dialog closes
            if (addProductImage) URL.revokeObjectURL(addProductImage);
            setAddProductImage(null);
            setAddProductImageFile(null);
          }
        }}>
        <DialogContent className="max-h-[80vh] w-full md:w-[400px] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Product to Shop</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedProduct && (
              <div className="flex items-center space-x-4 mb-4">
                <img
                  src={addProductImage || getImageUrl(selectedProduct.img)}
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
            
            {/* Image Upload */}
            <div className="space-y-2">
              <label className="block font-semibold">Update Product Image (optional)</label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try {
                        // Compress image if it's larger than 1MB
                        const compressedFile = file.size > 1024 * 1024 
                          ? await compressImage(file) 
                          : file;
                        setAddProductImageFile(compressedFile);
                        setAddProductImage(URL.createObjectURL(compressedFile));
                      } catch (error) {
                        console.error('Error compressing image:', error);
                        setAddProductImageFile(file);
                        setAddProductImage(URL.createObjectURL(file));
                      }
                    }
                  }}
                  className="flex-1"
                />
              </div>
              {addProductImage && (
                <div className="flex items-center gap-2 mt-2">
                  <img src={addProductImage} alt="New image preview" className="w-12 h-12 object-cover rounded-md" />
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setAddProductImage(null);
                      setAddProductImageFile(null);
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </Button>
                </div>
              )}
            </div>
            
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
                  <OptimizedScanner
                    width={300}
                    height={200}
                    onScan={(result) => setAddProductCaseBarcode(result)}
                  />
                </div>
              )}
            </div>
            
            {/* Required fields for adding existing product */}
            <div className="space-y-2">
              <label className="block font-semibold">Price</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
                <Input
                  type="text"
                  placeholder="e.g. 456 = £4.56"
                  value={addProductPrice}
                  onChange={(e) => handlePriceChange(e.target.value, setAddProductPrice)}
                  className="pl-7"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="block font-semibold">Aisle Number</label>
              <Input
                type="text"
                placeholder="Enter Aisle Number"
                value={addProductAiel}
                onChange={(e) => setAddProductAiel(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="block font-semibold">RRP</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
                <Input
                  type="text"
                  placeholder="e.g. 599 = £5.99"
                  value={addProductRrp}
                  onChange={(e) => handlePriceChange(e.target.value, setAddProductRrp)}
                  className="pl-7"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="block font-semibold">Case Size</label>
              <Input
                type="text"
                placeholder="e.g. 1, 12, 500ml"
                value={addProductcaseSize}
                onChange={(e) => setAddProductcaseSize(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="block font-semibold">Packet Size</label>
              <Input
                type="text"
                placeholder="e.g. 1, 500ml, 1kg"
                value={addProductpacketSize}
                onChange={(e) => setAddProductpacketSize(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="block font-semibold">Category</label>
              {/* Quick select grid chips - mobile friendly */}
              <div className="flex flex-wrap gap-1.5">
                {["Confectionery", "Crisps", "Soft Drinks", "Alcohol", "Grocery", "Pet Food", "Health & Beauty", "House Hold", "Hardware", "Medicines", "Cigarettes", "Single Spirits", "Cakes & Bread", "Chill Foods", "Frozen & Ice Cream"].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setAddProductCategory(cat)}
                    className={`px-2 py-1 text-[10px] sm:text-xs rounded-full transition-colors ${
                      addProductCategory === cat
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
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

      {/* Bundle Promotion Dialog */}
      <BundlePromotionDialog
        open={showBundlePromotionDialog}
        onOpenChange={setShowBundlePromotionDialog}
        shopId={id || ""}
        onPromotionCreated={() => {
          // Optionally refresh products if needed
        }}
      />
    </div>
  );
};

export default ShopDetail;
