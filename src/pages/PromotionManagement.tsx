import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Image, Plus, X, Eye, Package, Store, Calendar, Trash2 } from "lucide-react";
import { toast } from "sonner";

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
}

interface Promotion {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  shopId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  shop: Shop;
  products: Product[];
}

const PromotionManagement: React.FC = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    shopId: '',
    imageFile: null as File | null,
    imagePreview: ''
  });

  const [searchQuery, setSearchQuery] = useState('');

  const API_BASE = 'http://localhost:3000/api';
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
        imagePreview: ''
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

  const addProduct = (product: Product) => {
    if (!selectedProducts.find(p => p.id === product.id)) {
      console.log('➕ Adding product:', {
        title: product.title,
        price: product.price,
        rrp: product.rrp,
        id: product.id
      });
      setSelectedProducts(prev => [...prev, product]);
    }
  };

  const removeProduct = (productId: string) => {
    setSelectedProducts(prev => prev.filter(p => p.id !== productId));
  };

  const createPromotion = async () => {
    if (!formData.title || !formData.shopId || !formData.imageFile || selectedProducts.length === 0) {
      toast.error('Please fill all required fields and select at least one product');
      return;
    }

    setCreating(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('shopId', formData.shopId);
      formDataToSend.append('image', formData.imageFile);
      formDataToSend.append('productIds', JSON.stringify(selectedProducts.map(p => p.id)));

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
        toast.error(`Failed to create promotion: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating promotion:', error);
      toast.error('Network error. Please try again.');
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

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      shopId: '',
      imageFile: null,
      imagePreview: ''
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

              {/* Image Upload */}
              <div>
                <label className="text-sm font-medium mb-2 block">Promotion Image *</label>
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

              {/* Product Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block">Select Products *</label>
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
                  placeholder="Search products... (type 3+ characters)"
                  className="mb-4"
                />
                
                {/* Selected Products */}
                {selectedProducts.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Selected Products ({selectedProducts.length})</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedProducts.map((product) => (
                        <Badge key={product.id} variant="secondary" className="flex items-center gap-1">
                          {product.title}
                          <X 
                            size={12} 
                            className="cursor-pointer hover:text-red-500" 
                            onClick={() => removeProduct(product.id)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Available Products */}
                <div className="max-h-64 overflow-y-auto border rounded">
                  {filteredProducts.map((product) => (
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
                          <p className="text-sm text-green-600">£{Number(product.price || product.rrp || 0).toFixed(2)}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={selectedProducts.find(p => p.id === product.id) ? "secondary" : "outline"}
                        onClick={() => addProduct(product)}
                        disabled={!!selectedProducts.find(p => p.id === product.id)}
                      >
                        {selectedProducts.find(p => p.id === product.id) ? 'Added' : <Plus size={16} />}
                      </Button>
                    </div>
                  ))}
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
          promotions.map((promotion) => (
            <Card key={promotion.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {promotion.title}
                      <Badge variant={promotion.isActive ? "default" : "secondary"}>
                        {promotion.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      <Store size={14} className="inline mr-1" />
                      {promotion.shop.name} • {promotion.products.length} products
                      <Calendar size={14} className="inline ml-3 mr-1" />
                      {new Date(promotion.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
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
                    <img 
                      src={promotion.imageUrl} 
                      alt={promotion.title}
                      className="w-full h-48 object-cover rounded-lg"
                    />
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
                          <span className="text-green-600 ml-auto">£{Number(product.price || product.rrp || 0).toFixed(2)}</span>
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
          ))
        )}
      </div>
    </div>
  );
};

export default PromotionManagement;