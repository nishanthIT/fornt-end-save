import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Image, Plus, X, Eye, Package, Store, Calendar, Trash2, FileText, Images, Pencil } from "lucide-react";
import { toast } from "sonner";
import { API_CONFIG } from "@/config/api";

interface Shop {
  id: string;
  name: string;
  address: string;
  mobile: string;
}

interface Product {
  id: string;
  title: string;
  barcode?: string;
  img?: string;
  rrp: string;
  price?: string;
  offerPrice?: string;
}

interface EditableProduct extends Product {
  editedPrice?: string;
  editedOfferPrice?: string;
}

interface Promotion {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  imageUrls?: string[];  // Multiple images for carousel
  pdfUrl?: string;       // PDF document URL
  shopId: string;
  isActive: boolean;
  startDate?: string;    // Promotion start date
  endDate?: string;      // Optional end date - null means never expires
  createdAt: string;
  updatedAt: string;
  shop: Shop;
  products: Product[];
}

const PromotionManagement: React.FC = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<EditableProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Edit state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [updating, setUpdating] = useState(false);
  const [editProducts, setEditProducts] = useState<Product[]>([]);
  const [editSelectedProducts, setEditSelectedProducts] = useState<EditableProduct[]>([]);
  const [editSearchQuery, setEditSearchQuery] = useState('');

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    shopId: '',
    imageFile: null as File | null,
    imagePreview: '',
    existingImageUrl: '',
    imageFiles: [] as File[],
    imagePreviews: [] as string[],
    existingImageUrls: [] as string[],
    pdfFile: null as File | null,
    pdfName: '',
    existingPdfUrl: '',
    startDate: '',
    endDate: ''
  });

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    shopId: '',
    imageFile: null as File | null,
    imagePreview: '',
    imageFiles: [] as File[],      // Multiple images for carousel
    imagePreviews: [] as string[], // Preview URLs for multiple images
    pdfFile: null as File | null,  // PDF file
    pdfName: '',                    // PDF filename for display
    startDate: '',                  // Promotion start date
    endDate: ''                     // Optional end date - empty means never expires
  });

  const [searchQuery, setSearchQuery] = useState('');

  const API_BASE = API_CONFIG.BASE_URL;
  const token = localStorage.getItem('auth_token');

  useEffect(() => {
    loadData();
  }, []);

  // Load products when shop is selected (Note: Backend loads all products, not shop-specific)
  useEffect(() => {
    if (formData.shopId) {
      console.log('🏦 Shop selected:', formData.shopId, '- Loading products (all shops)');
      setProducts([]); // Clear previous products
      setSelectedProducts([]); // Clear selected products
      loadProducts(formData.shopId); // shopId passed for logging only
    } else {
      console.log('🏦 No shop selected - Clearing products');
      setProducts([]);
      setSelectedProducts([]);
    }
  }, [formData.shopId]);

  // Clear form and products when dialog opens/closes
  useEffect(() => {
    if (!isCreateDialogOpen) {
      // Dialog closed - reset everything
      setFormData({
        title: '',
        description: '',
        shopId: '',
        imageFile: null,
        imagePreview: '',
        imageFiles: [],
        imagePreviews: [],
        pdfFile: null,
        pdfName: '',
        startDate: '',
        endDate: ''
      });
      setProducts([]);
      setSelectedProducts([]);
      setSearchQuery('');
      console.log('🔄 Dialog closed - Form and products cleared');
    } else {
      console.log('🔄 Dialog opened - Ready for new promotion');
    }
  }, [isCreateDialogOpen]);

  const loadData = async () => {
    await Promise.all([
      loadPromotions(),
      loadShops()
    ]);
    setLoading(false);
  };

  const loadPromotions = async () => {
    try {
      const response = await fetch(`${API_BASE}/promotions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPromotions(data.promotions || []);
      }
    } catch (error) {
      console.error('Error loading promotions:', error);
      toast.error('Failed to load promotions');
    }
  };

  const loadShops = async () => {
    try {
      console.log('🏪 Loading shops from:', `${API_BASE}/getAllshop`);
      const response = await fetch(`${API_BASE}/getAllshop`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('🏪 Shop response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('🏪 Shop data received:', data);
        // Handle different response formats
        const shopsList = data.shops || data || [];
        console.log('🏪 Setting shops:', shopsList);
        setShops(shopsList);
      } else {
        const errorText = await response.text();
        console.error('🏪 Shop loading failed:', response.status, errorText);
      }
    } catch (error) {
      console.error('Error loading shops:', error);
    }
  };

  const loadProducts = async (shopId?: string, searchTerm?: string) => {
    if (!shopId) {
      console.log('❌ No shop selected - cannot load products');
      setProducts([]);
      return;
    }

    try {
      // Use the correct shop-specific endpoint with proper parameters
      let url = `${API_BASE}/shop/${shopId}/products?page=1`;
      if (searchTerm && searchTerm.length >= 3) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
        console.log('📦 Loading shop products with search:', url);
        console.log('🔍 Searching for products in shop', shopId, 'containing:', searchTerm);
      } else {
        console.log('📦 Loading all products from shop:', shopId, 'URL:', url);
      }
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('📦 Product response status:', response.status);
      console.log('📦 Product response headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const data = await response.json();
        console.log('📦 Raw API response:', data);
        console.log('📦 Response structure:', {
          hasProducts: !!data.products,
          productsLength: data.products?.length,
          total: data.total,
          page: data.page
        });
        
        const productsList = data.products || [];
        console.log('📦 Shop products loaded:', productsList.length, 'out of', data.total, 'total');
        
        if (Array.isArray(productsList)) {
          // Map the shop product structure to match our component expectations
          const mappedProducts = productsList.map(item => ({
            id: item.productId,
            title: item.title,
            barcode: item.barcode,
            caseBarcode: item.caseBarcode,
            price: item.price,
            offerPrice: item.offerPrice,
            rrp: item.rrp,
            img: item.img,
            caseSize: item.caseSize,
            packetSize: item.packetSize,
            retailSize: item.retailSize
          }));
          
          setProducts(mappedProducts);
          console.log('✅ Successfully set', mappedProducts.length, 'shop products');
          
          // Debug: Check if test103 exists in loaded data
          const test103Products = mappedProducts.filter(p => 
            p.title?.toLowerCase().includes('test103') || 
            p.barcode?.toLowerCase().includes('test103')
          );
          console.log('🔍 Products containing "test103":', test103Products.length, 'found:', test103Products);
          
          // Log all product titles for debugging
          console.log('📝 Shop product titles (first 10):', mappedProducts.slice(0, 10).map(p => p.title));
        } else {
          console.error('⚠️ Products data is not an array:', typeof productsList, productsList);
          setProducts([]);
        }
      } else {
        const errorText = await response.text();
        console.error('📦 Product loading failed:', response.status, response.statusText, errorText);
        setProducts([]);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, imageFile: file }));
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({ ...prev, imagePreview: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle multiple image uploads for carousel
  const handleMultipleImagesUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      setFormData(prev => ({ ...prev, imageFiles: [...prev.imageFiles, ...fileArray] }));
      
      // Create preview URLs for all new files
      fileArray.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFormData(prev => ({ 
            ...prev, 
            imagePreviews: [...prev.imagePreviews, e.target?.result as string] 
          }));
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // Remove an image from the carousel
  const removeCarouselImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      imageFiles: prev.imageFiles.filter((_, i) => i !== index),
      imagePreviews: prev.imagePreviews.filter((_, i) => i !== index)
    }));
  };

  // Handle PDF upload
  const handlePdfUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'application/pdf') {
        setFormData(prev => ({ ...prev, pdfFile: file, pdfName: file.name }));
      } else {
        toast.error('Please upload a PDF file');
      }
    }
  };

  // Remove PDF
  const removePdf = () => {
    setFormData(prev => ({ ...prev, pdfFile: null, pdfName: '' }));
  };

  const addProduct = (product: Product) => {
    if (!selectedProducts.find(p => p.id === product.id)) {
      console.log('➕ Adding product:', {
        title: product.title,
        price: product.price,
        offerPrice: product.offerPrice,
        rrp: product.rrp,
        id: product.id
      });
      setSelectedProducts(prev => [...prev, {
        ...product,
        editedPrice: product.price || '',
        editedOfferPrice: product.offerPrice || ''
      }]);
    }
  };

  const removeProduct = (productId: string) => {
    setSelectedProducts(prev => prev.filter(p => p.id !== productId));
  };

  // Update product price in create promotion
  const updateProductPrice = (productId: string, field: 'editedPrice' | 'editedOfferPrice', value: string) => {
    setSelectedProducts(prev => prev.map(p => 
      p.id === productId ? { ...p, [field]: value } : p
    ));
  };

  // Helper to format price input
  const formatPrice = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    if (!digits) return '';
    const num = parseInt(digits, 10);
    return (num / 100).toFixed(2);
  };

  const createPromotion = async () => {
    // Check for at least one image (either single or multiple)
    const hasImage = formData.imageFile || formData.imageFiles.length > 0;
    
    if (!formData.title || !formData.shopId || !hasImage || selectedProducts.length === 0) {
      toast.error('Please fill all required fields, add at least one image, and select at least one product');
      return;
    }

    setCreating(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('shopId', formData.shopId);
      formDataToSend.append('productIds', JSON.stringify(selectedProducts.map(p => p.id)));
      
      // Send product prices (offer prices) for each product
      const productPrices = selectedProducts.map(p => ({
        productId: p.id,
        price: p.editedPrice || null,
        offerPrice: p.editedOfferPrice || null
      }));
      formDataToSend.append('productPrices', JSON.stringify(productPrices));
      
      // Add single image if provided (legacy support)
      if (formData.imageFile) {
        formDataToSend.append('image', formData.imageFile);
      }
      
      // Add multiple images for carousel
      formData.imageFiles.forEach((file) => {
        formDataToSend.append('images', file);
      });
      
      // Add PDF if provided
      if (formData.pdfFile) {
        formDataToSend.append('pdf', formData.pdfFile);
      }
      
      // Add start date (use today if not specified)
      formDataToSend.append('startDate', formData.startDate || new Date().toISOString().split('T')[0]);
      
      // Add end date (optional - empty means never expires)
      if (formData.endDate) {
        formDataToSend.append('endDate', formData.endDate);
      }

      const response = await fetch(`${API_BASE}/promotions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      if (response.ok) {
        toast.success('✅ Promotion created successfully!');
        setIsCreateDialogOpen(false);
        resetForm();
        loadPromotions();
      } else {
        const error = await response.json();
        console.error('Server error:', error);
        toast.error(`Failed to create promotion: ${error.error || error.details || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Error creating promotion:', error);
      console.error('Error details:', error.message);
      toast.error(`Network error: ${error.message || 'Please check if server is running'}`);
    } finally {
      setCreating(false);
    }
  };

  const togglePromotionStatus = async (promotionId: string, isActive: boolean) => {
    try {
      const response = await fetch(`${API_BASE}/promotions/${promotionId}/toggle`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !isActive })
      });

      if (response.ok) {
        toast.success(`Promotion ${!isActive ? 'activated' : 'deactivated'} successfully!`);
        loadPromotions();
      }
    } catch (error) {
      console.error('Error toggling promotion:', error);
      toast.error('Failed to update promotion status');
    }
  };

  const deletePromotion = async (promotionId: string) => {
    if (!confirm('Are you sure you want to delete this promotion?')) return;

    try {
      const response = await fetch(`${API_BASE}/promotions/${promotionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success('Promotion deleted successfully!');
        loadPromotions();
      }
    } catch (error) {
      console.error('Error deleting promotion:', error);
      toast.error('Failed to delete promotion');
    }
  };

  // Open edit dialog with promotion data
  const openEditDialog = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    setEditFormData({
      title: promotion.title,
      description: promotion.description || '',
      shopId: promotion.shopId,
      imageFile: null,
      imagePreview: '',
      existingImageUrl: promotion.imageUrl,
      imageFiles: [],
      imagePreviews: [],
      existingImageUrls: promotion.imageUrls || [],
      pdfFile: null,
      pdfName: '',
      existingPdfUrl: promotion.pdfUrl || '',
      startDate: promotion.startDate ? new Date(promotion.startDate).toISOString().split('T')[0] : '',
      endDate: promotion.endDate ? new Date(promotion.endDate).toISOString().split('T')[0] : ''
    });
    // Convert products to editable products with prices
    setEditSelectedProducts(promotion.products.map(p => ({
      ...p,
      editedPrice: p.price || '',
      editedOfferPrice: p.offerPrice || ''
    })));
    setEditProducts([]);
    setEditSearchQuery('');
    setIsEditDialogOpen(true);
    // Load products for the shop
    loadProductsForEdit(promotion.shopId);
  };

  // Load products for edit dialog
  const loadProductsForEdit = async (shopId: string, searchTerm?: string) => {
    try {
      let url = `${API_BASE}/shop/${shopId}/products?page=1`;
      if (searchTerm && searchTerm.length >= 3) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        const productsList = data.products || [];
        const mappedProducts = productsList.map((item: any) => ({
          id: item.productId,
          title: item.title,
          barcode: item.barcode,
          price: item.price,
          offerPrice: item.offerPrice,
          rrp: item.rrp,
          img: item.img
        }));
        setEditProducts(mappedProducts);
      }
    } catch (error) {
      console.error('Error loading products for edit:', error);
    }
  };

  // Handle edit image upload
  const handleEditImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setEditFormData(prev => ({ ...prev, imageFile: file }));
      const reader = new FileReader();
      reader.onload = (e) => {
        setEditFormData(prev => ({ ...prev, imagePreview: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle multiple images upload for edit
  const handleEditMultipleImagesUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      setEditFormData(prev => ({ ...prev, imageFiles: [...prev.imageFiles, ...fileArray] }));
      fileArray.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          setEditFormData(prev => ({ 
            ...prev, 
            imagePreviews: [...prev.imagePreviews, e.target?.result as string] 
          }));
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // Remove carousel image from edit
  const removeEditCarouselImage = (index: number, isExisting: boolean) => {
    if (isExisting) {
      setEditFormData(prev => ({
        ...prev,
        existingImageUrls: prev.existingImageUrls.filter((_, i) => i !== index)
      }));
    } else {
      setEditFormData(prev => ({
        ...prev,
        imageFiles: prev.imageFiles.filter((_, i) => i !== index),
        imagePreviews: prev.imagePreviews.filter((_, i) => i !== index)
      }));
    }
  };

  // Handle PDF upload for edit
  const handleEditPdfUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setEditFormData(prev => ({ ...prev, pdfFile: file, pdfName: file.name }));
    } else {
      toast.error('Please upload a PDF file');
    }
  };

  // Remove PDF from edit
  const removeEditPdf = () => {
    setEditFormData(prev => ({ ...prev, pdfFile: null, pdfName: '', existingPdfUrl: '' }));
  };

  // Add product to edit selection
  const addEditProduct = (product: Product) => {
    if (!editSelectedProducts.find(p => p.id === product.id)) {
      setEditSelectedProducts(prev => [...prev, {
        ...product,
        editedPrice: product.price || '',
        editedOfferPrice: product.offerPrice || ''
      }]);
    }
  };

  // Remove product from edit selection
  const removeEditProduct = (productId: string) => {
    setEditSelectedProducts(prev => prev.filter(p => p.id !== productId));
  };

  // Update product price in edit
  const updateEditProductPrice = (productId: string, field: 'editedPrice' | 'editedOfferPrice', value: string) => {
    setEditSelectedProducts(prev => prev.map(p => 
      p.id === productId ? { ...p, [field]: value } : p
    ));
  };

  // Helper to format price input
  const formatPriceInput = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    if (!digits) return '';
    const num = parseInt(digits, 10);
    return (num / 100).toFixed(2);
  };

  // Update promotion
  const updatePromotion = async () => {
    if (!editingPromotion) return;
    
    if (!editFormData.title || editSelectedProducts.length === 0) {
      toast.error('Please fill title and select at least one product');
      return;
    }

    setUpdating(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', editFormData.title);
      formDataToSend.append('description', editFormData.description);
      formDataToSend.append('shopId', editFormData.shopId);
      formDataToSend.append('productIds', JSON.stringify(editSelectedProducts.map(p => p.id)));
      
      // Send product prices as JSON
      const productPrices = editSelectedProducts.map(p => ({
        productId: p.id,
        price: p.editedPrice || null,
        offerPrice: p.editedOfferPrice || null
      }));
      formDataToSend.append('productPrices', JSON.stringify(productPrices));
      
      // Add new primary image if uploaded
      if (editFormData.imageFile) {
        formDataToSend.append('image', editFormData.imageFile);
      }
      
      // Add new carousel images
      editFormData.imageFiles.forEach((file) => {
        formDataToSend.append('images', file);
      });
      
      // Send existing image URLs to keep
      formDataToSend.append('keepExistingImageUrls', JSON.stringify(editFormData.existingImageUrls));
      formDataToSend.append('keepExistingPrimaryImage', (!editFormData.imageFile && editFormData.existingImageUrl) ? 'true' : 'false');
      
      // Add PDF if uploaded
      if (editFormData.pdfFile) {
        formDataToSend.append('pdf', editFormData.pdfFile);
      }
      formDataToSend.append('keepExistingPdf', editFormData.existingPdfUrl ? 'true' : 'false');
      
      // Add start date
      if (editFormData.startDate) {
        formDataToSend.append('startDate', editFormData.startDate);
      }
      
      // Add end date (optional)
      if (editFormData.endDate) {
        formDataToSend.append('endDate', editFormData.endDate);
      } else {
        formDataToSend.append('endDate', ''); // Empty string = null (no expiry)
      }

      const response = await fetch(`${API_BASE}/promotions/${editingPromotion.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      if (response.ok) {
        toast.success('✅ Promotion updated successfully!');
        setIsEditDialogOpen(false);
        setEditingPromotion(null);
        loadPromotions();
      } else {
        const error = await response.json();
        toast.error(`Failed to update promotion: ${error.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Error updating promotion:', error);
      toast.error(`Network error: ${error.message || 'Please check if server is running'}`);
    } finally {
      setUpdating(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      shopId: '',
      imageFile: null,
      imagePreview: '',
      imageFiles: [],
      imagePreviews: [],
      pdfFile: null,
      pdfName: '',
      startDate: '',
      endDate: ''
    });
    setSelectedProducts([]);
  };

  // Use products directly since we're doing API-based search now
  const filteredProducts = products;

  // Debug logging
  console.log('🔍 Search Query:', searchQuery);
  console.log('📦 Total Products:', products.length);
  console.log('🎯 Products to display:', filteredProducts.length);
  
  // Enhanced debugging for search results
  if (searchQuery.length >= 3) {
    console.log('🔎 API search active for:', searchQuery);
    console.log('📋 Search results (first 5):');
    products.slice(0, 5).forEach((p, index) => {
      console.log(`   ${index + 1}. "${p.title}" (Barcode: "${p.barcode}")`);
    });
  } else if (searchQuery.length > 0) {
    console.log('🔍 Type more characters to search (need 3+)');
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Promotion Management</h1>
          <p className="text-muted-foreground">
            Create and manage promotional campaigns
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus size={16} className="mr-2" />
              Create Promotion
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Promotion</DialogTitle>
              <DialogDescription>
                Upload an image, select shop and products for your promotion
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Promotion Title *</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter promotion title"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Select Shop *</label>
                  <Select value={formData.shopId} onValueChange={(value) => setFormData(prev => ({ ...prev, shopId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a shop" />
                    </SelectTrigger>
                    <SelectContent>
                      {shops.map((shop) => (
                        <SelectItem key={shop.id} value={shop.id}>
                          {shop.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter promotion description"
                  rows={3}
                />
              </div>

              {/* Start and End Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    <Calendar className="inline mr-2" size={16} />
                    Start Date
                  </label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    placeholder="Select start date"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Leave empty for today</p>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    <Calendar className="inline mr-2" size={16} />
                    End Date <span className="text-muted-foreground">(optional)</span>
                  </label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    placeholder="Select end date"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Leave empty for no expiry (auto-deactivate disabled)</p>
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="text-sm font-medium mb-2 block">Primary Promotion Image *</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  {formData.imagePreview ? (
                    <div className="relative">
                      <img 
                        src={formData.imagePreview} 
                        alt="Preview" 
                        className="max-h-64 mx-auto rounded"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => setFormData(prev => ({ ...prev, imageFile: null, imagePreview: '' }))}
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="mx-auto mb-4" size={48} />
                      <p className="text-lg mb-2">Upload promotion image</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        JPG, PNG or GIF up to 10MB
                      </p>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="max-w-xs mx-auto"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Multiple Images Upload (Carousel) */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  <Images className="inline mr-2" size={16} />
                  Additional Images (Carousel) - Optional
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  {formData.imagePreviews.length > 0 && (
                    <div className="grid grid-cols-4 gap-3 mb-4">
                      {formData.imagePreviews.map((preview, index) => (
                        <div key={index} className="relative">
                          <img 
                            src={preview} 
                            alt={`Preview ${index + 1}`} 
                            className="w-full h-24 object-cover rounded"
                          />
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute -top-2 -right-2 h-6 w-6 p-0"
                            onClick={() => removeCarouselImage(index)}
                          >
                            <X size={12} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      Add multiple images for a slideshow carousel (up to 10 images)
                    </p>
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleMultipleImagesUpload}
                      className="max-w-xs mx-auto"
                    />
                  </div>
                </div>
              </div>

              {/* PDF Upload */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  <FileText className="inline mr-2" size={16} />
                  PDF Document - Optional
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  {formData.pdfFile ? (
                    <div className="flex items-center justify-between bg-gray-100 p-3 rounded">
                      <div className="flex items-center gap-2">
                        <FileText size={24} className="text-red-500" />
                        <span className="text-sm font-medium">{formData.pdfName}</span>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={removePdf}
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <FileText className="mx-auto mb-2 text-muted-foreground" size={32} />
                      <p className="text-sm text-muted-foreground mb-2">
                        Upload a PDF document (up to 20MB)
                      </p>
                      <Input
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={handlePdfUpload}
                        className="max-w-xs mx-auto"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Product Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block">Select Products *</label>
                
                {/* Selected Products with Offer Price Editing */}
                {selectedProducts.length > 0 && (
                  <div className="mb-4 border rounded-lg p-4 bg-muted/30">
                    <h4 className="font-medium mb-3">Selected Products ({selectedProducts.length})</h4>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {selectedProducts.map((product) => (
                        <div key={product.id} className="flex items-center gap-3 p-3 bg-background rounded-lg border">
                          {product.img && (
                            <img 
                              src={product.img} 
                              alt={product.title}
                              className="w-12 h-12 object-cover rounded"
                            />
                          )}
                          <div className="flex-grow min-w-0">
                            <p className="font-medium truncate">{product.title}</p>
                            <p className="text-xs text-muted-foreground">
                              RRP: £{Number(product.rrp || 0).toFixed(2)} | 
                              Current Price: £{Number(product.price || product.rrp || 0).toFixed(2)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-24">
                              <label className="text-xs text-muted-foreground">Offer Price *</label>
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">£</span>
                                <Input
                                  className="pl-5 h-8 text-sm"
                                  placeholder="0.00"
                                  value={product.editedOfferPrice}
                                  onChange={(e) => {
                                    const formatted = formatPrice(e.target.value);
                                    updateProductPrice(product.id, 'editedOfferPrice', formatted);
                                  }}
                                />
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => removeProduct(product.id)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Search Products */}
                <Input
                  value={searchQuery}
                  onChange={(e) => {
                    const value = e.target.value;
                    console.log('🔍 Search input changed to:', value);
                    setSearchQuery(value);
                    
                    // Trigger API search when user types 3+ characters
                    if (value.length >= 3 && formData.shopId) {
                      console.log('🔍 Triggering API search for:', value);
                      loadProducts(formData.shopId, value);
                    } else if (value.length === 0 && formData.shopId) {
                      // Clear search - load all products
                      console.log('🔍 Search cleared - loading all products');
                      loadProducts(formData.shopId);
                    }
                  }}
                  placeholder="Search products in this shop... (type 3+ characters)"
                  className="mb-4"
                />

                {/* Info about products */}
                {formData.shopId && (
                  <p className="text-xs text-muted-foreground mb-2">
                    <Store size={12} className="inline mr-1" />
                    Showing products available in the selected shop only
                  </p>
                )}

                {/* Available Products */}
                <div className="max-h-64 overflow-y-auto border rounded">
                  {filteredProducts.filter(p => !selectedProducts.find(sp => sp.id === p.id)).map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-3 border-b hover:bg-muted/50">
                      <div className="flex items-center gap-3">
                        {product.img && (
                          <img 
                            src={product.img} 
                            alt={product.title}
                            className="w-10 h-10 object-cover rounded"
                          />
                        )}
                        <div>
                          <p className="font-medium">{product.title}</p>
                          {product.barcode && (
                            <p className="text-sm text-muted-foreground">{product.barcode}</p>
                          )}
                          <div className="flex gap-2 text-sm">
                            <span className="text-green-600">£{Number(product.price || product.rrp || 0).toFixed(2)}</span>
                            {product.offerPrice && (
                              <span className="text-orange-600">Offer: £{Number(product.offerPrice).toFixed(2)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addProduct(product)}
                      >
                        <Plus size={16} />
                      </Button>
                    </div>
                  ))}
                  {filteredProducts.length === 0 && formData.shopId && (
                    <p className="p-4 text-center text-muted-foreground">
                      {searchQuery.length >= 3 ? 'No products found' : 'Type 3+ characters to search products'}
                    </p>
                  )}
                  {!formData.shopId && (
                    <p className="p-4 text-center text-muted-foreground">
                      Please select a shop first
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createPromotion} disabled={creating}>
                  {creating ? 'Creating...' : 'Create Promotion'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Promotions List */}
      <div className="grid gap-6">
        {promotions.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Image className="mx-auto mb-4 text-muted-foreground" size={48} />
              <h3 className="text-lg font-semibold mb-2">No Promotions Yet</h3>
              <p className="text-muted-foreground">
                Create your first promotion to get started
              </p>
            </CardContent>
          </Card>
        ) : (
          promotions.map((promotion) => {
            const isExpired = promotion.endDate && new Date(promotion.endDate) < new Date();
            const isUpcoming = promotion.startDate && new Date(promotion.startDate) > new Date();
            
            return (
            <Card key={promotion.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {promotion.title}
                      <Badge variant={promotion.isActive ? "default" : "secondary"}>
                        {promotion.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      {isExpired && (
                        <Badge variant="destructive">Expired</Badge>
                      )}
                      {isUpcoming && (
                        <Badge variant="outline" className="bg-yellow-100">Upcoming</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      <Store size={14} className="inline mr-1" />
                      {promotion.shop.name} • {promotion.products.length} products
                      <br />
                      <Calendar size={14} className="inline mr-1" />
                      {promotion.startDate ? new Date(promotion.startDate).toLocaleDateString() : 'Started'} 
                      {' - '}
                      {promotion.endDate ? new Date(promotion.endDate).toLocaleDateString() : 'No expiry'}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(promotion)}
                    >
                      <Pencil size={16} />
                    </Button>
                    <Button
                      size="sm"
                      variant={promotion.isActive ? "secondary" : "default"}
                      onClick={() => togglePromotionStatus(promotion.id, promotion.isActive)}
                    >
                      {promotion.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deletePromotion(promotion.id)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    {/* Primary Image */}
                    <img 
                      src={promotion.imageUrl} 
                      alt={promotion.title}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    
                    {/* Carousel Images */}
                    {promotion.imageUrls && promotion.imageUrls.length > 0 && (
                      <div className="mt-3">
                        <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                          <Images size={14} />
                          Additional Images ({promotion.imageUrls.length})
                        </h5>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {promotion.imageUrls.map((url: string, idx: number) => (
                            <img 
                              key={idx}
                              src={url} 
                              alt={`${promotion.title} ${idx + 1}`}
                              className="w-16 h-16 object-cover rounded flex-shrink-0"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* PDF Document */}
                    {promotion.pdfUrl && (
                      <div className="mt-3">
                        <a 
                          href={promotion.pdfUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                        >
                          <FileText size={16} />
                          <span className="text-sm font-medium">View PDF Document</span>
                        </a>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Package size={16} />
                      Products ({promotion.products.length})
                    </h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {promotion.products.map((product) => (
                        <div key={product.id} className="flex items-center gap-2 text-sm">
                          {product.img && (
                            <img 
                              src={product.img} 
                              alt={product.title}
                              className="w-8 h-8 object-cover rounded"
                            />
                          )}
                          <span>{product.title}</span>
                          <div className="ml-auto flex gap-2">
                            {product.offerPrice && (
                              <span className="text-orange-600 font-medium">£{Number(product.offerPrice).toFixed(2)}</span>
                            )}
                            <span className={product.offerPrice ? "text-muted-foreground line-through text-xs" : "text-green-600"}>
                              £{Number(product.price || product.rrp || 0).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {promotion.description && (
                      <div className="mt-4">
                        <h4 className="font-semibold mb-1">Description</h4>
                        <p className="text-sm text-muted-foreground">{promotion.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            );
          })
        )}
      </div>

      {/* Edit Promotion Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Promotion</DialogTitle>
            <DialogDescription>
              Modify promotion details, images, and products
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Promotion Title *</label>
                <Input
                  value={editFormData.title}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter promotion title"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Shop</label>
                <Input
                  value={editingPromotion?.shop.name || ''}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Description</label>
              <Textarea
                value={editFormData.description}
                onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter promotion description"
                rows={3}
              />
            </div>

            {/* Start and End Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  <Calendar className="inline mr-2" size={16} />
                  Start Date
                </label>
                <Input
                  type="date"
                  value={editFormData.startDate}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  <Calendar className="inline mr-2" size={16} />
                  End Date <span className="text-muted-foreground">(optional)</span>
                </label>
                <Input
                  type="date"
                  value={editFormData.endDate}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, endDate: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground mt-1">Leave empty for no expiry (auto-deactivate disabled)</p>
              </div>
            </div>

            {/* Primary Image */}
            <div>
              <label className="text-sm font-medium mb-2 block">Primary Promotion Image</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                {editFormData.imagePreview ? (
                  <div className="relative">
                    <img 
                      src={editFormData.imagePreview} 
                      alt="New Preview" 
                      className="max-h-48 mx-auto rounded"
                    />
                    <Badge className="absolute top-2 left-2 bg-green-500">New</Badge>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => setEditFormData(prev => ({ ...prev, imageFile: null, imagePreview: '' }))}
                    >
                      <X size={16} />
                    </Button>
                  </div>
                ) : editFormData.existingImageUrl ? (
                  <div className="relative">
                    <img 
                      src={editFormData.existingImageUrl} 
                      alt="Current" 
                      className="max-h-48 mx-auto rounded"
                    />
                    <Badge className="absolute top-2 left-2">Current</Badge>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => setEditFormData(prev => ({ ...prev, existingImageUrl: '' }))}
                    >
                      <X size={16} />
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="mx-auto mb-4" size={48} />
                    <p className="text-sm text-muted-foreground mb-4">Upload a new primary image</p>
                  </div>
                )}
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleEditImageUpload}
                  className="max-w-xs mx-auto mt-4"
                />
              </div>
            </div>

            {/* Carousel Images */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                <Images className="inline mr-2" size={16} />
                Additional Images (Carousel)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                {(editFormData.existingImageUrls.length > 0 || editFormData.imagePreviews.length > 0) && (
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    {editFormData.existingImageUrls.map((url, index) => (
                      <div key={`existing-${index}`} className="relative">
                        <img 
                          src={url} 
                          alt={`Existing ${index + 1}`} 
                          className="w-full h-24 object-cover rounded"
                        />
                        <Badge className="absolute top-1 left-1 text-xs">Current</Badge>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 h-6 w-6 p-0"
                          onClick={() => removeEditCarouselImage(index, true)}
                        >
                          <X size={12} />
                        </Button>
                      </div>
                    ))}
                    {editFormData.imagePreviews.map((preview, index) => (
                      <div key={`new-${index}`} className="relative">
                        <img 
                          src={preview} 
                          alt={`New ${index + 1}`} 
                          className="w-full h-24 object-cover rounded"
                        />
                        <Badge className="absolute top-1 left-1 text-xs bg-green-500">New</Badge>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 h-6 w-6 p-0"
                          onClick={() => removeEditCarouselImage(index, false)}
                        >
                          <X size={12} />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Add more images</p>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleEditMultipleImagesUpload}
                    className="max-w-xs mx-auto"
                  />
                </div>
              </div>
            </div>

            {/* PDF Document */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                <FileText className="inline mr-2" size={16} />
                PDF Document
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                {editFormData.pdfFile ? (
                  <div className="flex items-center justify-between bg-green-100 p-3 rounded">
                    <div className="flex items-center gap-2">
                      <FileText size={24} className="text-green-600" />
                      <span className="text-sm font-medium">{editFormData.pdfName} (New)</span>
                    </div>
                    <Button variant="destructive" size="sm" onClick={removeEditPdf}>
                      <X size={16} />
                    </Button>
                  </div>
                ) : editFormData.existingPdfUrl ? (
                  <div className="flex items-center justify-between bg-gray-100 p-3 rounded">
                    <div className="flex items-center gap-2">
                      <FileText size={24} className="text-red-500" />
                      <a href={editFormData.existingPdfUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:underline">
                        View Current PDF
                      </a>
                    </div>
                    <Button variant="destructive" size="sm" onClick={removeEditPdf}>
                      <X size={16} />
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <FileText className="mx-auto mb-2 text-muted-foreground" size={32} />
                    <p className="text-sm text-muted-foreground mb-2">Upload a PDF document</p>
                  </div>
                )}
                <Input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleEditPdfUpload}
                  className="max-w-xs mx-auto mt-2"
                />
              </div>
            </div>

            {/* Product Selection & Editing */}
            <div>
              <label className="text-sm font-medium mb-2 block">Products in Promotion *</label>
              
              {/* Selected Products with Price Editing */}
              {editSelectedProducts.length > 0 && (
                <div className="mb-4 border rounded-lg p-4 bg-muted/30">
                  <h4 className="font-medium mb-3">Selected Products ({editSelectedProducts.length})</h4>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {editSelectedProducts.map((product) => (
                      <div key={product.id} className="flex items-center gap-3 p-3 bg-background rounded-lg border">
                        {product.img && (
                          <img 
                            src={product.img} 
                            alt={product.title}
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                        <div className="flex-grow min-w-0">
                          <p className="font-medium truncate">{product.title}</p>
                          <p className="text-xs text-muted-foreground">RRP: £{Number(product.rrp || 0).toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-24">
                            <label className="text-xs text-muted-foreground">Price</label>
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">£</span>
                              <Input
                                className="pl-5 h-8 text-sm"
                                placeholder="0.00"
                                value={product.editedPrice}
                                onChange={(e) => {
                                  const formatted = formatPriceInput(e.target.value);
                                  updateEditProductPrice(product.id, 'editedPrice', formatted);
                                }}
                              />
                            </div>
                          </div>
                          <div className="w-24">
                            <label className="text-xs text-muted-foreground">Offer</label>
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">£</span>
                              <Input
                                className="pl-5 h-8 text-sm"
                                placeholder="0.00"
                                value={product.editedOfferPrice}
                                onChange={(e) => {
                                  const formatted = formatPriceInput(e.target.value);
                                  updateEditProductPrice(product.id, 'editedOfferPrice', formatted);
                                }}
                              />
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => removeEditProduct(product.id)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Search and Add Products */}
              <Input
                value={editSearchQuery}
                onChange={(e) => {
                  const value = e.target.value;
                  setEditSearchQuery(value);
                  if (value.length >= 3 && editFormData.shopId) {
                    loadProductsForEdit(editFormData.shopId, value);
                  } else if (value.length === 0 && editFormData.shopId) {
                    loadProductsForEdit(editFormData.shopId);
                  }
                }}
                placeholder="Search products to add... (type 3+ characters)"
                className="mb-4"
              />

              {/* Available Products */}
              <div className="max-h-48 overflow-y-auto border rounded">
                {editProducts.filter(p => !editSelectedProducts.find(sp => sp.id === p.id)).map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 border-b hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      {product.img && (
                        <img 
                          src={product.img} 
                          alt={product.title}
                          className="w-10 h-10 object-cover rounded"
                        />
                      )}
                      <div>
                        <p className="font-medium">{product.title}</p>
                        <p className="text-sm text-green-600">£{Number(product.price || product.rrp || 0).toFixed(2)}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addEditProduct(product)}
                    >
                      <Plus size={16} />
                    </Button>
                  </div>
                ))}
                {editProducts.length === 0 && editSearchQuery.length >= 3 && (
                  <p className="p-4 text-center text-muted-foreground">No products found</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={updatePromotion} disabled={updating}>
                {updating ? 'Updating...' : 'Update Promotion'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PromotionManagement;