import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Calendar, PoundSterling, Tag, AlertCircle, X } from "lucide-react";
import { toast } from "sonner";

interface Promotion {
  id?: string;
  startDate: string;
  endDate?: string | null; // Optional - null means never expires
  promotionPrice: number;
  description?: string;
  isActive: boolean;
}

interface MultiPromotionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shopId: string;
  productId: string;
  productTitle: string;
  regularPrice: number;
  existingPromotions?: Promotion[];
  onPromotionsUpdated?: () => void;
}

// Helper function to format price input (456 -> 4.56)
const formatPriceInput = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  const pence = parseInt(digits, 10);
  return (pence / 100).toFixed(2);
};

// Check if a promotion is currently active
const isPromotionActive = (promo: Promotion): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = new Date(promo.startDate);
  startDate.setHours(0, 0, 0, 0);
  
  if (!promo.isActive || today < startDate) return false;
  
  // If no end date, promotion never expires (always active after start)
  if (!promo.endDate) return true;
  
  const endDate = new Date(promo.endDate);
  endDate.setHours(23, 59, 59, 999);
  return today <= endDate;
};

// Check if a promotion is upcoming
const isPromotionUpcoming = (promo: Promotion): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = new Date(promo.startDate);
  startDate.setHours(0, 0, 0, 0);
  return promo.isActive && today < startDate;
};

// Check if a promotion is expired
const isPromotionExpired = (promo: Promotion): boolean => {
  if (!promo.endDate) return false; // No end date = never expires
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = new Date(promo.endDate);
  endDate.setHours(23, 59, 59, 999);
  return today > endDate;
};

export const MultiPromotionDialog = ({
  open,
  onOpenChange,
  shopId,
  productId,
  productTitle,
  regularPrice,
  existingPromotions = [],
  onPromotionsUpdated
}: MultiPromotionDialogProps) => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [newPromotions, setNewPromotions] = useState<{
    startDate: string;
    endDate: string;
    promotionPrice: string;
    description: string;
  }[]>([{ startDate: '', endDate: '', promotionPrice: '', description: '' }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch existing promotions when dialog opens
  useEffect(() => {
    if (open && shopId && productId) {
      fetchPromotions();
    }
  }, [open, shopId, productId]);

  const fetchPromotions = async () => {
    setIsLoading(true);
    try {
      const authToken = localStorage.getItem("auth_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api"}/product-promotions/${shopId}/${productId}`,
        {
          headers: {
            "Content-Type": "application/json",
            ...(authToken && { Authorization: `Bearer ${authToken}` }),
          },
          credentials: 'include'
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.promotions) {
          setPromotions(data.data.promotions);
        }
      }
    } catch (error) {
      console.error("Error fetching promotions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addNewPromotionRow = () => {
    setNewPromotions([...newPromotions, { startDate: '', endDate: '', promotionPrice: '', description: '' }]);
  };

  const removeNewPromotionRow = (index: number) => {
    if (newPromotions.length > 1) {
      setNewPromotions(newPromotions.filter((_, i) => i !== index));
    }
  };

  const updateNewPromotion = (index: number, field: string, value: string) => {
    const updated = [...newPromotions];
    if (field === 'promotionPrice') {
      updated[index] = { ...updated[index], [field]: formatPriceInput(value) };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setNewPromotions(updated);
  };

  const handleSubmitNewPromotions = async () => {
    // Filter out empty rows (only startDate and price are required)
    const validPromotions = newPromotions.filter(
      p => p.startDate && p.promotionPrice
    );

    if (validPromotions.length === 0) {
      toast.error("Please add at least one promotion with start date and price");
      return;
    }

    // Validate each promotion
    for (const promo of validPromotions) {
      const startDate = new Date(promo.startDate);
      const price = parseFloat(promo.promotionPrice);

      // Only validate end date if provided
      if (promo.endDate) {
        const endDate = new Date(promo.endDate);
        if (endDate < startDate) {
          toast.error("End date must be after start date");
          return;
        }
      }

      if (price >= regularPrice) {
        toast.error("Promotion price must be less than regular price (£" + regularPrice.toFixed(2) + ")");
        return;
      }

      if (price <= 0) {
        toast.error("Promotion price must be greater than 0");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const authToken = localStorage.getItem("auth_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api"}/product-promotions/${shopId}/${productId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(authToken && { Authorization: `Bearer ${authToken}` }),
          },
          credentials: 'include',
          body: JSON.stringify({
            promotions: validPromotions.map(p => ({
              startDate: p.startDate,
              endDate: p.endDate || null, // Send null if no end date (never expires)
              promotionPrice: parseFloat(p.promotionPrice),
              description: p.description || null
            }))
          })
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(`${validPromotions.length} promotion(s) added successfully`);
        setNewPromotions([{ startDate: '', endDate: '', promotionPrice: '', description: '' }]);
        fetchPromotions();
        onPromotionsUpdated?.();
      } else {
        toast.error(data.error || "Failed to add promotions");
      }
    } catch (error) {
      console.error("Error adding promotions:", error);
      toast.error("Failed to add promotions");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePromotion = async (promotionId: string) => {
    try {
      const authToken = localStorage.getItem("auth_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api"}/product-promotions/${promotionId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...(authToken && { Authorization: `Bearer ${authToken}` }),
          },
          credentials: 'include'
        }
      );

      if (response.ok) {
        toast.success("Promotion deleted");
        fetchPromotions();
        onPromotionsUpdated?.();
      } else {
        toast.error("Failed to delete promotion");
      }
    } catch (error) {
      console.error("Error deleting promotion:", error);
      toast.error("Failed to delete promotion");
    }
  };

  // Find the currently active lowest price
  const activePromotions = promotions.filter(isPromotionActive);
  const currentBestPromotion = activePromotions.length > 0
    ? activePromotions.reduce((lowest, current) => 
        current.promotionPrice < lowest.promotionPrice ? current : lowest
      )
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Manage Promotions - {productTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Price Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Regular Price</p>
                <p className="text-lg font-bold">£{regularPrice.toFixed(2)}</p>
              </div>
              {currentBestPromotion && (
                <div className="text-right">
                  <p className="text-sm text-gray-500">Current Best Price</p>
                  <p className="text-lg font-bold text-green-600">
                    £{currentBestPromotion.promotionPrice.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-400">
                    {currentBestPromotion.endDate 
                      ? `Until ${new Date(currentBestPromotion.endDate).toLocaleDateString()}`
                      : "Never expires"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Existing Promotions */}
          {isLoading ? (
            <p className="text-center text-gray-500">Loading promotions...</p>
          ) : promotions.length > 0 ? (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-700">Existing Promotions</h3>
              {promotions.map((promo) => {
                const active = isPromotionActive(promo);
                const upcoming = isPromotionUpcoming(promo);
                const expired = isPromotionExpired(promo);
                const isLowest = currentBestPromotion?.id === promo.id;
                
                return (
                  <div 
                    key={promo.id} 
                    className={`border rounded-lg p-3 ${
                      isLowest ? 'border-green-500 bg-green-50' :
                      active ? 'border-blue-300 bg-blue-50' :
                      upcoming ? 'border-yellow-300 bg-yellow-50' :
                      expired ? 'border-gray-200 bg-gray-50 opacity-60' :
                      'border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg font-bold text-green-600">
                            £{promo.promotionPrice.toFixed(2)}
                          </span>
                          {isLowest && (
                            <Badge className="bg-green-600 text-white text-xs">
                              Current Lowest
                            </Badge>
                          )}
                          {active && !isLowest && (
                            <Badge className="bg-blue-500 text-white text-xs">Active</Badge>
                          )}
                          {upcoming && (
                            <Badge className="bg-yellow-500 text-white text-xs">Upcoming</Badge>
                          )}
                          {expired && (
                            <Badge variant="outline" className="text-xs">Expired</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {new Date(promo.startDate).toLocaleDateString()} - {promo.endDate ? new Date(promo.endDate).toLocaleDateString() : "Never expires"}
                          </span>
                        </div>
                        {promo.description && (
                          <p className="text-sm text-gray-500 mt-1">{promo.description}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => promo.id && handleDeletePromotion(promo.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p>No promotions set for this product</p>
            </div>
          )}

          {/* Add New Promotions */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-700">Add New Promotions</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={addNewPromotionRow}
                className="flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                Add Row
              </Button>
            </div>

            {newPromotions.map((promo, index) => (
              <div key={index} className="border rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">
                    Promotion {index + 1}
                  </span>
                  {newPromotions.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeNewPromotionRow(index)}
                      className="text-red-500 hover:text-red-700 h-6 w-6 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="text-xs text-gray-500">Start Date</label>
                    <Input
                      type="date"
                      value={promo.startDate}
                      onChange={(e) => updateNewPromotion(index, 'startDate', e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">End Date <span className="text-gray-400">(optional)</span></label>
                    <Input
                      type="date"
                      value={promo.endDate}
                      onChange={(e) => updateNewPromotion(index, 'endDate', e.target.value)}
                      className="text-sm"
                      placeholder="Leave empty for no expiry"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Price</label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">£</span>
                      <Input
                        type="text"
                        placeholder="e.g. 299"
                        value={promo.promotionPrice}
                        onChange={(e) => updateNewPromotion(index, 'promotionPrice', e.target.value)}
                        className="pl-6 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Note (optional)</label>
                    <Input
                      type="text"
                      placeholder="e.g. Summer Sale"
                      value={promo.description}
                      onChange={(e) => updateNewPromotion(index, 'description', e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button
              onClick={handleSubmitNewPromotions}
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? "Adding Promotions..." : "Add Promotions"}
            </Button>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-700">
              <strong>Tip:</strong> You can add multiple overlapping promotions. 
              The system will automatically show the <strong>lowest price</strong> to customers 
              for any given date. Leave the end date empty for promotions that never expire. 
              Promotions with end dates will automatically deactivate when expired.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
