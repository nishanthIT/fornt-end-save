
import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { getImageUrl } from "@/utils/imageUtils";
import { Pencil, X, Upload, Barcode } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ProductCardProps {
  id: string;
  title: string;
  productUrl: string;
  caseSize: string;
  packetSize: string;
  img: string[] | null; // Updated to allow null
  barcode: string;
  caseBarcode: string | null;
  retailSize: string;
  rrp?: number | string;
  availability?: number;
  onClick?: () => void;
  onProductUpdated?: () => void;
}

export const ProductCard = ({
  id,
  title,
  productUrl,
  caseSize,
  packetSize,
  img,
  barcode,
  caseBarcode,
  retailSize,
  rrp,
  availability = 1, // Default availability
  onClick,
  onProductUpdated,
}: ProductCardProps) => {
  const navigate = useNavigate();
  const { id: shopId } = useParams();
  const location = useLocation();
  const isInShopDetail = location.pathname.includes("/shop/");
  const isInProductsPage = location.pathname === "/products"; // Check if the current route is /products

  const imageUrl = getImageUrl(img);

  // Edit dialog state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editForm, setEditForm] = useState({
    title: title || "",
    barcode: barcode || "",
    caseBarcode: caseBarcode || "",
    caseSize: caseSize || "1",
    packetSize: packetSize || "1",
    retailSize: retailSize || "",
    rrp: rrp ? String(rrp) : "",
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper function to format price input (456 -> 4.56)
  const formatPriceInput = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    if (!digits) return '';
    const num = parseInt(digits, 10);
    return (num / 100).toFixed(2);
  };

  const handlePriceChange = (value: string) => {
    const cleanValue = value.replace(/[^0-9]/g, '');
    const formatted = formatPriceInput(cleanValue);
    setEditForm(prev => ({ ...prev, rrp: formatted }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleEditSubmit = async () => {
    if (!editForm.title || !editForm.barcode) {
      toast.error("Title and barcode are required");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", editForm.title.toUpperCase());
      formData.append("barcode", editForm.barcode);
      formData.append("caseBarcode", editForm.caseBarcode);
      formData.append("caseSize", editForm.caseSize);
      formData.append("packetSize", editForm.packetSize);
      formData.append("retailSize", editForm.retailSize);
      formData.append("rrp", editForm.rrp);
      
      if (selectedImage) {
        formData.append("image", selectedImage);
      }

      const authToken = localStorage.getItem("auth_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api"}/editProduct/${id}`,
        {
          method: "PUT",
          body: formData,
          headers: {
            ...(authToken && { Authorization: `Bearer ${authToken}` }),
          },
          credentials: 'include'
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update product");
      }

      toast.success("Product updated successfully!");
      setIsEditDialogOpen(false);
      setSelectedImage(null);
      setImagePreview(null);
      
      // Trigger refresh if callback provided
      if (onProductUpdated) {
        onProductUpdated();
      }
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update product");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Reset form to current values
    setEditForm({
      title: title || "",
      barcode: barcode || "",
      caseBarcode: caseBarcode || "",
      caseSize: caseSize || "1",
      packetSize: packetSize || "1",
      retailSize: retailSize || "",
      rrp: rrp ? String(rrp) : "",
    });
    setSelectedImage(null);
    setImagePreview(null);
    setIsEditDialogOpen(true);
  };

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/shop/${shopId}/product/${id}`);
  };

  const handleProductClick = () => {
    if (onClick) {
      onClick();
    } else if (isInProductsPage) {
      // Navigate to /product/${id} only if on /products
      navigate(`/product/${id}`);
    } else if (!isInShopDetail) {
      navigate(`/product/${id}`);
    }
  };

  return (
    <>
      <Card
        className="product-card glass-card cursor-pointer w-full h-auto min-h-32"
        onClick={handleProductClick}
      >
        <CardContent className="p-4 h-full">
          <div className="flex items-center space-x-4 h-full">
            <img
              src={imageUrl}
              alt={title}
              className="w-16 h-16 object-cover rounded-md flex-shrink-0"
              loading="lazy"
            />
            <div className="flex-grow min-w-0 space-y-1 max-w-full">
              <h3 className="text-lg font-medium truncate">{title}</h3>
              <p className="text-sm text-gray-600 truncate">{packetSize}</p>
              <p className="text-sm text-gray-600 truncate">
                Case Size: {caseSize}
              </p>
              <div className="flex flex-wrap gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  Barcode: {barcode}
                </Badge>
                {rrp && (
                  <Badge variant="outline" className="text-xs">
                    RRP: £{typeof rrp === 'number' ? rrp.toFixed(2) : rrp}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end justify-between h-full flex-shrink-0 gap-2">
              {/* ADD button - only in shop detail */}
              {!isInProductsPage && isInShopDetail && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAdd}
                  className="mt-2"
                >
                  ADD
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="w-[95vw] max-w-md mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update product details below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs text-gray-600 mb-1 block">Product Name *</label>
                <Input
                  placeholder="Enter product name"
                  value={editForm.title}
                  onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value.toUpperCase() }))}
                  className="uppercase"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Barcode *</label>
                <Input
                  placeholder="Barcode"
                  value={editForm.barcode}
                  onChange={(e) => setEditForm(prev => ({ ...prev, barcode: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Case Barcode</label>
                <Input
                  placeholder="Case barcode"
                  value={editForm.caseBarcode}
                  onChange={(e) => setEditForm(prev => ({ ...prev, caseBarcode: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Case Size</label>
                <Input
                  placeholder="1"
                  value={editForm.caseSize}
                  onChange={(e) => setEditForm(prev => ({ ...prev, caseSize: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Packet Size</label>
                <Input
                  placeholder="1"
                  value={editForm.packetSize}
                  onChange={(e) => setEditForm(prev => ({ ...prev, packetSize: e.target.value }))}
                />
              </div>
              {/* Retail Size hidden per client request */}
              <div>
                <label className="text-xs text-gray-600 mb-1 block">RRP (e.g. 456 = £4.56)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
                  <Input
                    className="pl-7"
                    placeholder="0.00"
                    value={editForm.rrp}
                    onChange={(e) => handlePriceChange(e.target.value)}
                    inputMode="numeric"
                  />
                </div>
              </div>
            </div>

            {/* Current Image Preview */}
            <div className="space-y-2">
              <label className="text-xs text-gray-600 block">Current Image</label>
              <img
                src={imageUrl}
                alt={title}
                className="w-20 h-20 object-cover rounded-md"
              />
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <label className="text-xs text-gray-600 block">Upload New Image (Optional)</label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
                type="button"
              >
                <Upload className="mr-2 h-4 w-4" />
                {selectedImage ? 'Change Image' : 'Upload New Image'}
              </Button>
            </div>

            {imagePreview && (
              <div className="mt-2 flex justify-center relative">
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="New Product Preview"
                    className="max-h-40 max-w-full object-contain rounded"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-1 right-1 h-6 w-6 p-0 rounded-full"
                    onClick={handleRemoveImage}
                    type="button"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditSubmit}
                className="flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
