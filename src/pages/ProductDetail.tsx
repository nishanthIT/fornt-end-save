


import { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Upload, ScanLine, X } from "lucide-react";
import BarcodeScanner from "react-qr-barcode-scanner";
import { ShopAvailability } from "@/components/ShopAvailability";
import { TopLoadingBar } from "@/components/TopLoadingBar";
import { toast as sonnerToast } from "sonner";
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
import { getImageUrl } from "@/utils/imageUtils";

// Form validation schema
const productSchema = z.object({
  title: z.string(),
  barcode: z.string(),
  retailSize: z.string().optional(),
  caseSize: z.string().optional(),
  packetSize: z.string().optional(),
  rrp: z.string().optional(),
  caseBarcode: z.string().optional(),
});

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(false);
  const fileInputRef = useRef(null);
  
  // Barcode scanner states
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerType, setScannerType] = useState(null); // 'barcode' or 'caseBarcode'

  // Determine if the ID is a barcode or product ID
  const isBarcode = /^\d+$/.test(id); // Check if the ID is numeric (barcode)

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
        const endpoint = isBarcode
          ? `${baseUrl}/getProductByBarcode/${id}`
          : `${baseUrl}/getProductById/${id}`;

        const authToken = localStorage.getItem("auth_token");
        const response = await fetch(endpoint,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...(authToken && { Authorization: `Bearer ${authToken}` }),
            },
            credentials: 'include'
          });
        if (!response.ok) {
          throw new Error("Failed to fetch product data");
        }

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || "Product not found");
        }

        // Ensure shops is always an array
        const productData = {
          ...data.data,
          shops: data.data.shops ?? [], // Default to an empty array if shops is undefined
        };

        setProduct(productData);
      } catch (error) {
        console.error("Error fetching product:", error);
        setError(error.message);
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, isBarcode, toast]);

  console.log(product);
  const form = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: product?.title || "",
      barcode: product?.barcode || "",
      retailSize: product?.retailSize || "",
      caseSize: product?.caseSize || "",
      packetSize: product?.packetSize || "",
      rrp: product?.rrp || "",
      caseBarcode: product?.caseBarcode || ""
    },
  });

  // Reset form values when product data changes
  useEffect(() => {
    if (product) {
      form.reset({
        title: product.title,
        barcode: product.barcode,
        retailSize: product.retailSize || "",
        caseSize: product.caseSize || "",
        packetSize: product.packetSize || "",
        rrp: product.rrp || "",
        caseBarcode: product.caseBarcode || ""
      });
    }
  }, [product, form]);

  // Image compression function
  const compressImage = (file: File, maxWidth = 800, maxHeight = 800, quality = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
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
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
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
      
      img.src = URL.createObjectURL(file);
    });
  };

  // Handle image selection
  const handleImageChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Please select a valid image file",
          variant: "destructive",
        });
        return;
      }
      
      try {
        // Show loading state
        toast({
          title: "Processing",
          description: "Compressing image...",
        });
        
        // Compress the image
        const compressedFile = await compressImage(file);
        setSelectedImage(compressedFile);

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result);
        };
        reader.readAsDataURL(compressedFile);
        
        toast({
          title: "Success",
          description: `Image compressed from ${(file.size / 1024 / 1024).toFixed(2)}MB to ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`,
        });
      } catch (error) {
        console.error('Error compressing image:', error);
        toast({
          title: "Error",
          description: "Failed to process image. Using original.",
          variant: "destructive",
        });
        setSelectedImage(file);
        
        // Create preview with original file
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Handle removing the selected image
  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Trigger file input click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Barcode scanner functions
  const openScanner = (type) => {
    setScannerType(type);
    setIsScannerOpen(true);
  };

  const closeScanner = () => {
    setIsScannerOpen(false);
    setScannerType(null);
  };

  const handleScanResult = (err: any, result: any) => {
    if (result && scannerType) {
      form.setValue(scannerType, result.text);
      toast({
        title: "Success",
        description: `${scannerType === 'barcode' ? 'Barcode' : 'Case Barcode'} scanned successfully!`,
      });
      closeScanner();
    }
  };

  // Handle form submission
  const onSubmit = async (values) => {
    if (!values.title || !values.barcode) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Exit editing mode immediately
    setIsEditing(false);
    
    // Start loading bar
    setUploadProgress(true);

    // Submit in background
    try {
      const formData = new FormData();
      formData.append("title", values.title);
      formData.append("barcode", values.barcode);
      formData.append("retailSize", values.retailSize || "");
      formData.append("caseSize", values.caseSize || "");
      formData.append("packetSize", values.packetSize || "");
      formData.append("rrp", values.rrp || "");
      formData.append("caseBarcode", values.caseBarcode || "");

      if (selectedImage) {
        formData.append("image", selectedImage);
      }
      const authToken = localStorage.getItem("auth_token");

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api"}/editProduct/${product.id}`, {
        method: "PUT",
        body: formData,
        headers: {
          ...(authToken && { Authorization: `Bearer ${authToken}` }),
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update product");
      }

      const updatedData = await response.json();

      // Update local state with new data
      setProduct({
        ...product,
        ...updatedData.data,
      });

      sonnerToast.success("Product updated successfully");
    } catch (error) {
      console.error("Error updating product:", error);
      sonnerToast.error(error.message || "Failed to update product");
    } finally {
      setUploadProgress(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!product) {
    return <div>Product not found</div>;
  }

  return (
    <>
      <TopLoadingBar isLoading={uploadProgress} />
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Button variant="ghost" className="mb-6" onClick={() => navigate(-1)}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Products
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Section */}
        <div className="space-y-6">
          <div className="relative h-96">
            <img
              src={getImageUrl(product.img)}
              alt={product.title}
              className="w-96 h-96 object-cover rounded-lg shadow-lg"
            />
          </div>

          <div className="space-y-4">
            <Badge>{product.category}</Badge>
            <div className="flex justify-between items-center">
              <h1 className="text-4xl font-bold">{product.title}</h1>
              <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogTrigger asChild>
                  <Button>Edit Product</Button>
                </DialogTrigger>

                {/* Scrollable Modal */}
                <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto">
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
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Product Name *</FormLabel>
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
                            <FormLabel>Barcode *</FormLabel>
                            <FormControl>
                              <div className="flex gap-2">
                                <Input {...field} className="flex-1" />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openScanner('barcode')}
                                  className="px-3"
                                >
                                  <ScanLine className="h-4 w-4" />
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="caseBarcode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Case Barcode</FormLabel>
                            <FormControl>
                              <div className="flex gap-2">
                                <Input {...field} className="flex-1" />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openScanner('caseBarcode')}
                                  className="px-3"
                                >
                                  <ScanLine className="h-4 w-4" />
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="rrp"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>RRP</FormLabel>
                              <FormControl>
                                <Input {...field} type="number" step="0.01" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <FormField
                          control={form.control}
                          name="caseSize"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Case Size *</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="packetSize"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Packet Size *</FormLabel>
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
                              <FormLabel>Retail Size *</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Image Upload Section */}
                      <div className="space-y-2">
                        <FormLabel>Product Image</FormLabel>
                        <div
                          className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-md p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={handleUploadClick}
                        >
                          {imagePreview ? (
                            <div className="text-center">
                              <div className="relative inline-block">
                                <img
                                  src={imagePreview}
                                  alt="Preview"
                                  className="mx-auto max-h-40 object-contain mb-2"
                                />
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="absolute top-1 right-1 h-6 w-6 p-0 rounded-full"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveImage();
                                  }}
                                  type="button"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                type="button"
                              >
                                Change Image
                              </Button>
                            </div>
                          ) : (
                            <div className="text-center">
                              <Upload className="mx-auto h-12 w-12 text-gray-400" />
                              <p className="mt-1 text-sm text-gray-500">
                                Tap to upload product image
                              </p>
                              <p className="text-xs text-gray-400">
                                Background will be automatically removed
                              </p>
                            </div>
                          )}
                          <input
                            type="file"
                            accept="image/*,image/heic,image/heif"
                            capture="environment"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleImageChange}
                          />
                        </div>
                      </div>

                      <Button
                        type="submit"
                        className="w-full"
                      >
                        Save Changes
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>

              {/* Barcode Scanner Modal */}
              <Dialog open={isScannerOpen} onOpenChange={closeScanner}>
                <DialogContent className="max-w-md w-full max-h-[90vh] overflow-hidden">
                  <DialogHeader>
                    <DialogTitle>
                      Scan {scannerType === 'barcode' ? 'Barcode' : 'Case Barcode'}
                    </DialogTitle>
                  </DialogHeader>
                  
                  {isScannerOpen && (
                    <div className="w-full h-64 mb-4 overflow-hidden rounded-md border">
                      <BarcodeScanner
                        onUpdate={handleScanResult}
                        delay={500}
                        width="100%"
                        height="100%"
                      />
                    </div>
                  )}
                  
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={closeScanner}>
                      Cancel
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <p className="text-muted-foreground">{product.description}</p>

            {/* Product Details */}
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
                <div>
                  <p className="text-sm text-muted-foreground">Packet Size</p>
                  <p className="font-medium">{product.packetSize}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">RRP</p>
                  <p className="font-medium">{product.rrp}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">CaseBarcode</p>
                  <p className="font-medium">{product.caseBarcode}</p>
                </div>
              </div>
            </div>

            {/* Specifications */}
            <div className="space-y-2">
              <h3 className="font-semibold">Specifications:</h3>
              <ul className="list-disc list-inside space-y-1">
                {product.specs?.map((spec, index) => (
                  <li key={index} className="text-muted-foreground">{spec}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Right Section - Shop Availability */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold mb-4">Available at Stores</h2>
          <div className="space-y-4">
            {product.shops?.map((shop) => (
              <ShopAvailability key={shop.id || shop.name} shop={shop} />
            ))}
          </div>
        </div>
      </div>
      </div>
    </>
  );
};

export default ProductDetail;
