import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, Search, Gift, ShoppingCart, Package, Barcode } from "lucide-react";
import { getImageUrl } from "@/utils/imageUtils";
import { OptimizedScanner } from "@/components/OptimizedScanner";

interface BundleItem {
  productId: string;
  quantity: number;
  product?: {
    id: string;
    title: string;
    barcode: string;
    img: any;
  };
}

interface BundlePromotion {
  id: string;
  name: string;
  description?: string;
  promotionType: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  buyItems: BundleItem[];
  getItems: BundleItem[];
}

interface BundlePromotionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shopId: string;
  onPromotionCreated?: () => void;
}

export const BundlePromotionDialog = ({
  open,
  onOpenChange,
  shopId,
  onPromotionCreated,
}: BundlePromotionDialogProps) => {
  const [promotions, setPromotions] = useState<BundlePromotion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [promotionType, setPromotionType] = useState("BUY_X_GET_Y");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [buyItems, setBuyItems] = useState<BundleItem[]>([]);
  const [getItems, setGetItems] = useState<BundleItem[]>([]);
  
  // Search state
  const [buySearchQuery, setBuySearchQuery] = useState("");
  const [getSearchQuery, setGetSearchQuery] = useState("");
  const [buySearchResults, setBuySearchResults] = useState<any[]>([]);
  const [getSearchResults, setGetSearchResults] = useState<any[]>([]);
  const [searchingBuy, setSearchingBuy] = useState(false);
  const [searchingGet, setSearchingGet] = useState(false);
  
  // Scanner state
  const [showBuyScanner, setShowBuyScanner] = useState(false);
  const [showGetScanner, setShowGetScanner] = useState(false);

  // Fetch existing bundle promotions
  const fetchPromotions = async () => {
    setLoading(true);
    try {
      const auth_token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api"}/shop/${shopId}/bundle-promotions`,
        {
          headers: {
            "Content-Type": "application/json",
            ...(auth_token && { Authorization: `Bearer ${auth_token}` }),
          },
          credentials: 'include'
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setPromotions(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching bundle promotions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && shopId) {
      fetchPromotions();
    }
  }, [open, shopId]);

  // Search products
  const searchProducts = async (query: string, type: 'buy' | 'get') => {
    if (!query.trim()) {
      if (type === 'buy') setBuySearchResults([]);
      else setGetSearchResults([]);
      return;
    }

    if (type === 'buy') setSearchingBuy(true);
    else setSearchingGet(true);

    try {
      const auth_token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api"}/products/search?q=${encodeURIComponent(query)}&limit=10`,
        {
          headers: {
            "Content-Type": "application/json",
            ...(auth_token && { Authorization: `Bearer ${auth_token}` }),
          },
          credentials: 'include'
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        // API returns { success: true, data: [...] }
        const products = data.data || data || [];
        if (type === 'buy') setBuySearchResults(products.slice(0, 10));
        else setGetSearchResults(products.slice(0, 10));
      }
    } catch (error) {
      console.error("Error searching products:", error);
    } finally {
      if (type === 'buy') setSearchingBuy(false);
      else setSearchingGet(false);
    }
  };

  // Add product to buy/get list
  const addProduct = (product: any, type: 'buy' | 'get') => {
    const newItem: BundleItem = {
      productId: product.id,
      quantity: 1,
      product: {
        id: product.id,
        title: product.title,
        barcode: product.barcode,
        img: product.img
      }
    };

    if (type === 'buy') {
      if (!buyItems.find(item => item.productId === product.id)) {
        setBuyItems([...buyItems, newItem]);
      }
      setBuySearchQuery("");
      setBuySearchResults([]);
    } else {
      if (!getItems.find(item => item.productId === product.id)) {
        setGetItems([...getItems, newItem]);
      }
      setGetSearchQuery("");
      setGetSearchResults([]);
    }
  };

  // Remove product from buy/get list
  const removeProduct = (productId: string, type: 'buy' | 'get') => {
    if (type === 'buy') {
      setBuyItems(buyItems.filter(item => item.productId !== productId));
    } else {
      setGetItems(getItems.filter(item => item.productId !== productId));
    }
  };

  // Update quantity
  const updateQuantity = (productId: string, quantity: number, type: 'buy' | 'get') => {
    if (quantity < 1) return;
    
    if (type === 'buy') {
      setBuyItems(buyItems.map(item => 
        item.productId === productId ? { ...item, quantity } : item
      ));
    } else {
      setGetItems(getItems.map(item => 
        item.productId === productId ? { ...item, quantity } : item
      ));
    }
  };

  // Handle barcode scan
  const handleBarcodeScan = async (barcode: string, type: 'buy' | 'get') => {
    try {
      const auth_token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api"}/products/barcode/${barcode}`,
        {
          headers: {
            "Content-Type": "application/json",
            ...(auth_token && { Authorization: `Bearer ${auth_token}` }),
          },
          credentials: 'include'
        }
      );
      
      if (response.ok) {
        const result = await response.json();
        const product = result.data || result;
        addProduct(product, type);
        toast.success(`Added: ${product.title}`);
      } else {
        toast.error("Product not found");
      }
    } catch (error) {
      console.error("Error fetching product by barcode:", error);
      toast.error("Error scanning barcode");
    }
    
    if (type === 'buy') setShowBuyScanner(false);
    else setShowGetScanner(false);
  };

  // Create bundle promotion
  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Please enter a promotion name");
      return;
    }
    if (buyItems.length === 0) {
      toast.error("Please add at least one product to buy");
      return;
    }
    if (getItems.length === 0) {
      toast.error("Please add at least one product to get free");
      return;
    }

    setLoading(true);
    try {
      const auth_token = localStorage.getItem('auth_token');
      const requestBody = {
        shopId,
        name,
        description,
        promotionType,
        startDate: startDate || null,
        endDate: endDate || null,
        buyItems: buyItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        })),
        getItems: getItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        }))
      };
      console.log("Creating bundle promotion with:", requestBody);
      
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api"}/shop/${shopId}/bundle-promotions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(auth_token && { Authorization: `Bearer ${auth_token}` }),
          },
          body: JSON.stringify(requestBody),
          credentials: 'include'
        }
      );

      if (response.ok) {
        toast.success("Bundle promotion created successfully!");
        resetForm();
        setShowCreateForm(false);
        fetchPromotions();
        onPromotionCreated?.();
      } else {
        const error = await response.json();
        console.error("Bundle promotion error response:", error);
        toast.error(error.error || "Failed to create promotion");
      }
    } catch (error) {
      console.error("Error creating bundle promotion:", error);
      toast.error("Error creating promotion: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Delete bundle promotion
  const handleDelete = async (promotionId: string) => {
    if (!confirm("Are you sure you want to delete this bundle promotion?")) return;

    try {
      const auth_token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api"}/bundle-promotions/${promotionId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...(auth_token && { Authorization: `Bearer ${auth_token}` }),
          },
          credentials: 'include'
        }
      );

      if (response.ok) {
        toast.success("Bundle promotion deleted");
        fetchPromotions();
      } else {
        toast.error("Failed to delete promotion");
      }
    } catch (error) {
      console.error("Error deleting promotion:", error);
      toast.error("Error deleting promotion");
    }
  };

  // Reset form
  const resetForm = () => {
    setName("");
    setDescription("");
    setPromotionType("BUY_X_GET_Y");
    setStartDate("");
    setEndDate("");
    setBuyItems([]);
    setGetItems([]);
    setBuySearchQuery("");
    setGetSearchQuery("");
    setBuySearchResults([]);
    setGetSearchResults([]);
  };

  // Product item component
  const ProductItem = ({ item, type, onRemove, onUpdateQuantity }: {
    item: BundleItem;
    type: 'buy' | 'get';
    onRemove: () => void;
    onUpdateQuantity: (qty: number) => void;
  }) => (
    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
      <img
        src={getImageUrl(item.product?.img)}
        alt={item.product?.title || ""}
        className="w-10 h-10 object-cover rounded"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.product?.title}</p>
        <p className="text-xs text-gray-500">{item.product?.barcode}</p>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => onUpdateQuantity(item.quantity - 1)}
        >
          -
        </Button>
        <span className="w-8 text-center text-sm">{item.quantity}</span>
        <Button
          variant="outline"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => onUpdateQuantity(item.quantity + 1)}
        >
          +
        </Button>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0 text-red-500"
        onClick={onRemove}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Bundle Promotions (Buy X Get Y)
          </DialogTitle>
        </DialogHeader>

        {!showCreateForm ? (
          <div className="space-y-4">
            <Button onClick={() => setShowCreateForm(true)} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Create New Bundle Promotion
            </Button>

            {loading ? (
              <p className="text-center text-gray-500">Loading...</p>
            ) : promotions.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No bundle promotions yet</p>
            ) : (
              <div className="space-y-3">
                {promotions.map((promo) => (
                  <div key={promo.id} className="border rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{promo.name}</h4>
                        {promo.description && (
                          <p className="text-sm text-gray-500">{promo.description}</p>
                        )}
                        <Badge variant={promo.isActive ? "default" : "secondary"} className="mt-1">
                          {promo.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500"
                        onClick={() => handleDelete(promo.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div className="bg-blue-50 p-2 rounded">
                        <p className="text-xs font-medium text-blue-700 mb-1 flex items-center gap-1">
                          <ShoppingCart className="h-3 w-3" /> Buy
                        </p>
                        {promo.buyItems.map((item) => (
                          <div key={item.productId} className="text-xs">
                            {item.quantity}x {item.product?.title}
                          </div>
                        ))}
                      </div>
                      <div className="bg-green-50 p-2 rounded">
                        <p className="text-xs font-medium text-green-700 mb-1 flex items-center gap-1">
                          <Gift className="h-3 w-3" /> Get FREE
                        </p>
                        {promo.getItems.map((item) => (
                          <div key={item.productId} className="text-xs">
                            {item.quantity}x {item.product?.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Promotion Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Buy 2 Get 1 Free"
                />
              </div>
              <div>
                <Label>Type</Label>
                <select
                  value={promotionType}
                  onChange={(e) => setPromotionType(e.target.value)}
                  className="w-full h-9 px-3 border rounded-md"
                >
                  <option value="BOGO">Buy One Get One (BOGO)</option>
                  <option value="BUY_X_GET_Y">Buy X Get Y Free</option>
                  <option value="MULTI_BUY">Multi-Buy Bundle</option>
                </select>
              </div>
            </div>

            <div>
              <Label>Description (optional)</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the offer..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start Date (optional)</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label>End Date (optional)</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            {/* Buy Items Section */}
            <div className="border rounded-lg p-3 bg-blue-50/50">
              <h4 className="font-medium text-blue-800 flex items-center gap-2 mb-2">
                <ShoppingCart className="h-4 w-4" />
                Products to BUY
              </h4>
              
              <div className="flex gap-2 mb-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    value={buySearchQuery}
                    onChange={(e) => {
                      setBuySearchQuery(e.target.value);
                      searchProducts(e.target.value, 'buy');
                    }}
                    placeholder="Search products..."
                    className="pl-9"
                  />
                  {buySearchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {buySearchResults.map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer"
                          onClick={() => addProduct(product, 'buy')}
                        >
                          <img
                            src={getImageUrl(product.img)}
                            alt={product.title}
                            className="w-8 h-8 object-cover rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{product.title}</p>
                            <p className="text-xs text-gray-500">{product.barcode}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowBuyScanner(true)}
                >
                  <Barcode className="h-4 w-4" />
                </Button>
              </div>

              {showBuyScanner && (
                <div className="mb-2 rounded-lg overflow-hidden">
                  <OptimizedScanner
                    onScan={(result) => handleBarcodeScan(result, 'buy')}
                    onError={() => toast.error("Scanner error")}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-1"
                    onClick={() => setShowBuyScanner(false)}
                  >
                    Close Scanner
                  </Button>
                </div>
              )}

              <div className="space-y-2">
                {buyItems.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-2">
                    Add products that customer needs to buy
                  </p>
                ) : (
                  buyItems.map((item) => (
                    <ProductItem
                      key={item.productId}
                      item={item}
                      type="buy"
                      onRemove={() => removeProduct(item.productId, 'buy')}
                      onUpdateQuantity={(qty) => updateQuantity(item.productId, qty, 'buy')}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Get Items Section */}
            <div className="border rounded-lg p-3 bg-green-50/50">
              <h4 className="font-medium text-green-800 flex items-center gap-2 mb-2">
                <Gift className="h-4 w-4" />
                Products to GET FREE
              </h4>
              
              <div className="flex gap-2 mb-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    value={getSearchQuery}
                    onChange={(e) => {
                      setGetSearchQuery(e.target.value);
                      searchProducts(e.target.value, 'get');
                    }}
                    placeholder="Search products..."
                    className="pl-9"
                  />
                  {getSearchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {getSearchResults.map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer"
                          onClick={() => addProduct(product, 'get')}
                        >
                          <img
                            src={getImageUrl(product.img)}
                            alt={product.title}
                            className="w-8 h-8 object-cover rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{product.title}</p>
                            <p className="text-xs text-gray-500">{product.barcode}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowGetScanner(true)}
                >
                  <Barcode className="h-4 w-4" />
                </Button>
              </div>

              {showGetScanner && (
                <div className="mb-2 rounded-lg overflow-hidden">
                  <OptimizedScanner
                    onScan={(result) => handleBarcodeScan(result, 'get')}
                    onError={() => toast.error("Scanner error")}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-1"
                    onClick={() => setShowGetScanner(false)}
                  >
                    Close Scanner
                  </Button>
                </div>
              )}

              <div className="space-y-2">
                {getItems.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-2">
                    Add products customer will get for free
                  </p>
                ) : (
                  getItems.map((item) => (
                    <ProductItem
                      key={item.productId}
                      item={item}
                      type="get"
                      onRemove={() => removeProduct(item.productId, 'get')}
                      onUpdateQuantity={(qty) => updateQuantity(item.productId, qty, 'get')}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  resetForm();
                  setShowCreateForm(false);
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleCreate}
                disabled={loading}
              >
                {loading ? "Creating..." : "Create Promotion"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
