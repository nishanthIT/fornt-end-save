import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Tag, Clock, PoundSterling, Pencil, Upload, X, Tags, Barcode, Check, PackageX, Trash2 } from "lucide-react";
import { getImageUrl } from "@/utils/imageUtils";
import { toast } from "sonner";
import { CategorySelect } from "@/components/CategorySelect";
import { MultiPromotionDialog } from "@/components/MultiPromotionDialog";
import { OptimizedScanner } from "@/components/OptimizedScanner";
import { useAuth } from "@/contexts/AuthContext";

interface ProductAtShopCardProps {
  productId: string;
  shopId: string;
  title: string;
  caseSize: string;
  packetSize: string;
  retailSize: string;
  barcode: string;
  caseBarcode: string | null;
  img: string[] | { url?: string } | null;
  category?: string;
  price: number;
  offerPrice?: number;
  offerExpiryDate?: string;
  aiel: string;
  rrp: number;
  outOfStock?: boolean;
  onPriceUpdate: (productId: string, newPrice: number) => void;
  onOfferUpdate: (productId: string, regularPrice: number, offerPrice: number | null, offerExpiryDate: string | null) => void;
  onProductUpdated?: () => void;
  onOutOfStockToggle?: (productId: string, outOfStock: boolean) => void;
  onRemove?: (productId: string) => void;
}

// Helper function to calculate days remaining
const getDaysRemaining = (expiryDate: string) => {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Helper function to format date for display
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

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

// Handle price input change
const handlePriceInputChange = (value: string, setter: (val: string) => void) => {
  const cleanValue = value.replace(/[^0-9]/g, '');
  const formatted = formatPriceInput(cleanValue);
  setter(formatted);
};

export const ProductAtShopCard = ({
  productId,
  shopId,
  title,
  caseSize,
  packetSize,
  retailSize,
  barcode,
  caseBarcode,
  img,
  category,
  price,
  offerPrice,
  offerExpiryDate,
  aiel,
  rrp,
  outOfStock = false,
  onPriceUpdate,
  onOfferUpdate,
  onProductUpdated,
  onOutOfStockToggle,
  onRemove,
}: ProductAtShopCardProps) => {
  const { user } = useAuth();
  const employeeId = user?.id;
  
  const [isEditing, setIsEditing] = useState(false);
  const [editPrice, setEditPrice] = useState(price.toString());
  const [editOfferPrice, setEditOfferPrice] = useState(offerPrice?.toString() || "");
  const [editOfferExpiryDate, setEditOfferExpiryDate] = useState(
    offerExpiryDate ? new Date(offerExpiryDate).toISOString().slice(0, 10) : ""
  );

  // Edit Product Dialog state
  const [showEditProductDialog, setShowEditProductDialog] = useState(false);
  const [editProductTitle, setEditProductTitle] = useState(title);
  const [editProductCaseSize, setEditProductCaseSize] = useState(caseSize);
  const [editProductPacketSize, setEditProductPacketSize] = useState(packetSize);
  const [editProductRetailSize, setEditProductRetailSize] = useState(retailSize);
  const [editProductRrp, setEditProductRrp] = useState(rrp.toString());
  const [editProductBarcode, setEditProductBarcode] = useState(barcode);
  const [editProductCaseBarcode, setEditProductCaseBarcode] = useState(caseBarcode || "");
  const [editProductCategory, setEditProductCategory] = useState(category || "");
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Barcode scanner states
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showCaseBarcodeScanner, setShowCaseBarcodeScanner] = useState(false);
  
  // Direct editing states for aisle and price (always visible)
  const [inlineAisle, setInlineAisle] = useState(aiel || "");
  const [inlinePrice, setInlinePrice] = useState(price.toString());
  
  // Multi-promotion dialog state
  const [showMultiPromotionDialog, setShowMultiPromotionDialog] = useState(false);

  const currentPrice = offerPrice && offerExpiryDate && new Date(offerExpiryDate) > new Date() ? offerPrice : price;
  const hasActiveOffer = offerPrice && offerExpiryDate && new Date(offerExpiryDate) > new Date();
  const daysRemaining = hasActiveOffer ? getDaysRemaining(offerExpiryDate!) : 0;
  // Orange styling only shows when offer expires in 1 day or less
  const isUrgentOffer = hasActiveOffer && daysRemaining <= 1;

  // Update component state when props change (after data refresh)
  useEffect(() => {
    setEditPrice(price.toString());
    setEditOfferPrice(offerPrice?.toString() || "");
    setEditOfferExpiryDate(
      offerExpiryDate ? new Date(offerExpiryDate).toISOString().slice(0, 10) : ""
    );
    setInlineAisle(aiel || "");
    setInlinePrice(price.toString());
  }, [price, offerPrice, offerExpiryDate, aiel]);

  // Handle inline save for aisle and price
  const handleInlineSave = async () => {
    const newPrice = parseFloat(inlinePrice);
    if (isNaN(newPrice) || newPrice <= 0) {
      toast.error("Please enter a valid price");
      return;
    }
    
    try {
      const authToken = localStorage.getItem("auth_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api"}/shop/${shopId}/updateProductPrice`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(authToken && { Authorization: `Bearer ${authToken}` }),
          },
          body: JSON.stringify({
            productId,
            price: newPrice,
            aisle: inlineAisle || null,
            employeeId,
          }),
          credentials: 'include'
        }
      );
      
      if (response.ok) {
        toast.success("Updated successfully!");
        // Don't call onProductUpdated to avoid refetch - the card's internal state 
        // is already updated and the data is saved on the backend
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update");
      }
    } catch (error) {
      console.error("Error updating:", error);
      toast.error("Error updating product");
    }
  };

  const handleSave = () => {
    const newPrice = parseFloat(editPrice);
    const newOfferPrice = editOfferPrice && editOfferPrice.trim() !== '' ? parseFloat(editOfferPrice) : null;
    // Set expiry time to end of day (23:59:59)
    const newOfferExpiryDate = editOfferExpiryDate && editOfferExpiryDate.trim() !== '' 
      ? `${editOfferExpiryDate}T23:59:59` 
      : null;

    console.log('Saving price changes:', {
      productId,
      editPrice,
      newPrice,
      editOfferPrice,
      newOfferPrice,
      editOfferExpiryDate,
      newOfferExpiryDate
    });

    // Validate regular price
    if (isNaN(newPrice) || newPrice <= 0) {
      alert('Please enter a valid regular price');
      return;
    }

    // Validate offer price if provided
    if (editOfferPrice && editOfferPrice.trim() !== '' && (isNaN(newOfferPrice) || newOfferPrice <= 0)) {
      alert('Please enter a valid offer price');
      return;
    }

    // Validate that offer price is less than regular price
    if (newOfferPrice && newOfferPrice >= newPrice) {
      alert('Offer price must be less than regular price');
      return;
    }

    // Validate that expiry date is provided if offer price is set
    if (newOfferPrice && !newOfferExpiryDate) {
      alert('Please set an expiry date for the offer');
      return;
    }

    // Validate that expiry date is today or in the future
    if (newOfferExpiryDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expiryDate = new Date(editOfferExpiryDate);
      if (expiryDate < today) {
        alert('Offer expiry date must be today or in the future');
        return;
      }
    }

    console.log('Calling onOfferUpdate with:', {
      productId,
      regularPrice: newPrice,
      offerPrice: newOfferPrice,
      offerExpiryDate: newOfferExpiryDate
    });

    // Use onOfferUpdate which handles both price and offer in a single API call
    onOfferUpdate(productId, newPrice, newOfferPrice, newOfferExpiryDate);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditPrice(price.toString());
    setEditOfferPrice(offerPrice?.toString() || "");
    setEditOfferExpiryDate(
      offerExpiryDate ? new Date(offerExpiryDate).toISOString().slice(0, 16) : ""
    );
    setIsEditing(false);
  };

  // Image compression function for camera captures
  const compressImage = (file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }
      
      const img = new Image();
      
      img.onload = () => {
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
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => resolve(file);
      img.src = URL.createObjectURL(file);
    });
  };

  // Handle image selection
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        // Compress if larger than 1MB
        const compressedFile = file.size > 1024 * 1024 
          ? await compressImage(file) 
          : file;
        setSelectedImage(compressedFile);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(compressedFile);
      } catch (error) {
        setSelectedImage(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle editing the product itself - runs in background
  const handleEditProductSave = async () => {
    if (!editProductTitle.trim()) {
      toast.error("Title is required");
      return;
    }

    // Close dialog immediately and show uploading toast
    setShowEditProductDialog(false);
    
    // Show uploading indicator toast
    const hasImage = !!selectedImage;
    const uploadingToast = toast.loading(hasImage ? "Uploading product image..." : "Saving product...");
    
    // Capture form data before resetting
    const formDataToSend = new FormData();
    formDataToSend.append("title", editProductTitle);
    formDataToSend.append("caseSize", editProductCaseSize);
    formDataToSend.append("packetSize", editProductPacketSize);
    formDataToSend.append("retailSize", editProductRetailSize);
    formDataToSend.append("rrp", String(parseFloat(editProductRrp) || 0));
    formDataToSend.append("barcode", editProductBarcode);
    formDataToSend.append("caseBarcode", editProductCaseBarcode || "");
    formDataToSend.append("category", editProductCategory || "");
    
    if (selectedImage) {
      formDataToSend.append("image", selectedImage);
    }
    
    // Reset image state
    setSelectedImage(null);
    setImagePreview(null);
    
    // Run upload in background
    try {
      const authToken = localStorage.getItem("auth_token");

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api"}/editProduct/${productId}`,
        {
          method: "PUT",
          headers: {
            ...(authToken && { Authorization: `Bearer ${authToken}` }),
          },
          body: formDataToSend,
        }
      );

      if (response.ok) {
        toast.dismiss(uploadingToast);
        toast.success("Product updated successfully!");
        // Refresh data without page reload
        if (onProductUpdated) {
          onProductUpdated();
        }
      } else {
        const error = await response.json();
        toast.dismiss(uploadingToast);
        toast.error(error.error || "Failed to update product");
      }
    } catch (error) {
      console.error("Error updating product:", error);
      toast.dismiss(uploadingToast);
      toast.error("Error updating product");
    }
  };

  return (
    <Card className={`product-card w-full relative ${outOfStock ? 'ring-2 ring-gray-400 bg-gray-100 opacity-75' : isUrgentOffer ? 'ring-2 ring-orange-400 bg-orange-50' : ''}`}>
      {/* Out of Stock Badge - Top Left */}
      {outOfStock && (
        <div className="absolute top-0 left-0 px-2 py-1 rounded-br-lg bg-gray-600 text-white">
          <span className="text-xs font-bold">Out of Stock</span>
        </div>
      )}
      {/* Price Badge - Top Right Corner */}
      <div className={`absolute top-0 right-0 px-2 py-1 rounded-bl-lg ${hasActiveOffer ? 'bg-orange-500 text-white' : 'bg-green-600 text-white'}`}>
        <span className="text-sm font-bold">£{currentPrice.toFixed(2)}</span>
        {hasActiveOffer && (
          <span className="text-[9px] ml-1">({daysRemaining > 0 ? `${daysRemaining}d` : '!'})</span>
        )}
      </div>
      
      <CardContent className={`p-3 ${outOfStock ? 'pt-8' : 'pt-2'}`}>
        {/* Row 1: Product Info + Action Icons */}
        <div className="flex items-center gap-2">
          <img
            src={getImageUrl(img)}
            alt={title}
            className={`w-12 h-12 object-cover rounded flex-shrink-0 ${outOfStock ? 'grayscale' : ''}`}
            loading="lazy"
          />
          <div className="flex-1 min-w-0 pr-12">
            <h3 className="text-sm font-semibold line-clamp-2 leading-tight">{title}</h3>
            <div className="text-[10px] text-gray-500">
              Case: {caseSize} | Pkt: {packetSize} | {barcode}
            </div>
          </div>
          {/* Action Icons */}
          <div className="flex gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditProductTitle(title);
                setEditProductCaseSize(caseSize);
                setEditProductPacketSize(packetSize);
                setEditProductRetailSize(retailSize);
                setEditProductRrp(rrp.toString());
                setEditProductBarcode(barcode);
                setEditProductCaseBarcode(caseBarcode || "");
                setEditProductCategory(category || "");
                setSelectedImage(null);
                setImagePreview(null);
                setShowEditProductDialog(true);
              }}
              className="h-8 w-8 p-0"
              title="Edit Product"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMultiPromotionDialog(true)}
              className="h-8 w-8 p-0"
              title="Promotions"
            >
              <Tags className="h-4 w-4" />
            </Button>
            <Button
              variant={isUrgentOffer ? "default" : "ghost"}
              size="sm"
              onClick={() => setIsEditing(true)}
              className={`h-8 w-8 p-0 ${isUrgentOffer ? 'bg-orange-500 hover:bg-orange-600' : ''}`}
              title="Set Offer"
            >
              <Tag className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Row 2: Quick Edit */}
        <div className="flex items-center gap-2 mt-2 pt-2 border-t">
          <div className="flex-1">
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-gray-500">£</span>
              <Input
                type="text"
                value={inlinePrice}
                onChange={(e) => handlePriceInputChange(e.target.value, setInlinePrice)}
                className="h-8 text-sm pl-6"
                placeholder="Price"
              />
            </div>
          </div>
          <div className="w-16">
            <Input
              type="text"
              value={inlineAisle}
              onChange={(e) => setInlineAisle(e.target.value)}
              className="h-8 text-sm text-center"
              placeholder="Aisle"
            />
          </div>
          <Button size="sm" onClick={handleInlineSave} className="h-8 px-3">
            <Check className="h-4 w-4" />
          </Button>
        </div>

        {/* Offer Edit Form (Expandable) */}
        {isEditing && (
          <div className="mt-2 pt-2 border-t space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Regular Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">£</span>
                  <Input
                    type="text"
                    value={editPrice}
                    onChange={(e) => handlePriceInputChange(e.target.value, setEditPrice)}
                    className="h-9 text-sm pl-7"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Offer Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">£</span>
                  <Input
                    type="text"
                    value={editOfferPrice}
                    onChange={(e) => handlePriceInputChange(e.target.value, setEditOfferPrice)}
                    className={`h-9 text-sm pl-7 ${isUrgentOffer ? 'border-orange-400' : ''}`}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Expires</label>
                <Input
                  type="date"
                  value={editOfferExpiryDate}
                  onChange={(e) => setEditOfferExpiryDate(e.target.value)}
                  className={`h-9 text-sm ${isUrgentOffer ? 'border-orange-400' : ''}`}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCancel} className="flex-1 h-9">
                Cancel
              </Button>
              {hasActiveOffer && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    if (window.confirm('Clear this offer?')) {
                      setEditOfferPrice("");
                      setEditOfferExpiryDate("");
                      const newPrice = parseFloat(editPrice);
                      if (!isNaN(newPrice) && newPrice > 0) {
                        onOfferUpdate(productId, newPrice, null, null);
                        setIsEditing(false);
                      }
                    }
                  }}
                  className="h-9 text-red-600 hover:text-red-700"
                >
                  Clear Offer
                </Button>
              )}
              <Button size="sm" onClick={handleSave} className="flex-1 h-9">
                Save Offer
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {/* Edit Product Dialog */}
      <Dialog open={showEditProductDialog} onOpenChange={setShowEditProductDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                value={editProductTitle}
                onChange={(e) => setEditProductTitle(e.target.value)}
                placeholder="Product title"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Case Size</label>
                <Input
                  value={editProductCaseSize}
                  onChange={(e) => setEditProductCaseSize(e.target.value)}
                  placeholder="e.g. 12"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Packet Size</label>
                <Input
                  value={editProductPacketSize}
                  onChange={(e) => setEditProductPacketSize(e.target.value)}
                  placeholder="e.g. 6"
                />
              </div>
            </div>
            {/* Retail Size hidden per client request */}
            <div>
              <label className="text-sm font-medium">RRP (e.g. 456 = £4.56)</label>
              <Input
                type="text"
                inputMode="numeric"
                value={editProductRrp}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '');
                  if (!digits) { setEditProductRrp(''); return; }
                  const pence = parseInt(digits, 10);
                  setEditProductRrp((pence / 100).toFixed(2));
                }}
                placeholder="e.g. 456 = £4.56"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Barcode</label>
                <div className="relative">
                  <Input
                    value={editProductBarcode}
                    onChange={(e) => setEditProductBarcode(e.target.value)}
                    placeholder="Barcode"
                    className="pr-10"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowBarcodeScanner(true)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                    title="Scan Barcode"
                  >
                    <Barcode className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Case Barcode</label>
                <div className="relative">
                  <Input
                    value={editProductCaseBarcode}
                    onChange={(e) => setEditProductCaseBarcode(e.target.value)}
                    placeholder="Case barcode"
                    className="pr-10"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCaseBarcodeScanner(true)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                    title="Scan Case Barcode"
                  >
                    <Barcode className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Category - Scrollable */}
            <div>
              <label className="text-sm font-medium">Category</label>
              <CategorySelect
                value={editProductCategory}
                onChange={setEditProductCategory}
                placeholder="Select category..."
              />
            </div>

            {/* Current Image */}
            <div>
              <label className="text-sm font-medium">Current Image</label>
              <img
                src={getImageUrl(img)}
                alt={title}
                className="w-16 h-16 object-cover rounded-md mt-1"
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className="text-sm font-medium">Upload New Image (Optional)</label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />
              {imagePreview ? (
                <div className="relative w-16 h-16 mt-1">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover rounded-md"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-1"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choose Image
                </Button>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowEditProductDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditProductSave}
                disabled={isEditingProduct}
                className="flex-1"
              >
                {isEditingProduct ? "Saving..." : "Save"}
              </Button>
            </div>
            
            {/* Stock and Remove Actions */}
            <div className="flex gap-2 pt-4 border-t mt-4">
              <Button
                variant={outOfStock ? "default" : "outline"}
                onClick={() => {
                  // Use the parent's handler which does local update
                  onOutOfStockToggle?.(productId, !outOfStock);
                  setShowEditProductDialog(false);
                }}
                className={`flex-1 ${outOfStock ? 'bg-gray-500 hover:bg-gray-600' : ''}`}
              >
                <PackageX className="h-4 w-4 mr-2" />
                {outOfStock ? "Mark In Stock" : "Mark Out of Stock"}
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (confirm(`Remove "${title}" from this shop? This cannot be undone.`)) {
                    onRemove?.(productId);
                    setShowEditProductDialog(false);
                  }
                }}
                className="flex-1"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove from Shop
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Multi-Promotion Dialog */}
      <MultiPromotionDialog
        open={showMultiPromotionDialog}
        onOpenChange={setShowMultiPromotionDialog}
        shopId={shopId}
        productId={productId}
        productTitle={title}
        regularPrice={price}
        onPromotionsUpdated={onProductUpdated}
      />

      {/* Barcode Scanner Dialog */}
      <Dialog open={showBarcodeScanner} onOpenChange={setShowBarcodeScanner}>
        <DialogContent className="w-[95vw] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>Scan Product Barcode</DialogTitle>
          </DialogHeader>
          <div className="w-full max-w-full overflow-hidden">
            <OptimizedScanner
              width="100%"
              height={250}
              onScan={(result) => {
                setEditProductBarcode(result);
                setShowBarcodeScanner(false);
                toast.success("Barcode scanned!");
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Case Barcode Scanner Dialog */}
      <Dialog open={showCaseBarcodeScanner} onOpenChange={setShowCaseBarcodeScanner}>
        <DialogContent className="w-[95vw] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>Scan Case Barcode</DialogTitle>
          </DialogHeader>
          <div className="w-full max-w-full overflow-hidden">
            <OptimizedScanner
              width="100%"
              height={250}
              onScan={(result) => {
                setEditProductCaseBarcode(result);
                setShowCaseBarcodeScanner(false);
                toast.success("Case barcode scanned!");
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};