import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Tag, Clock, PoundSterling } from "lucide-react";
import { getImageUrl } from "@/utils/imageUtils";

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
  price: number;
  offerPrice?: number;
  offerExpiryDate?: string;
  aiel: string;
  rrp: number;
  onPriceUpdate: (productId: string, newPrice: number) => void;
  onOfferUpdate: (productId: string, regularPrice: number, offerPrice: number | null, offerExpiryDate: string | null) => void;
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
  price,
  offerPrice,
  offerExpiryDate,
  aiel,
  rrp,
  onPriceUpdate,
  onOfferUpdate,
}: ProductAtShopCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editPrice, setEditPrice] = useState(price.toString());
  const [editOfferPrice, setEditOfferPrice] = useState(offerPrice?.toString() || "");
  const [editOfferExpiryDate, setEditOfferExpiryDate] = useState(
    offerExpiryDate ? new Date(offerExpiryDate).toISOString().slice(0, 10) : ""
  );

  const currentPrice = offerPrice && offerExpiryDate && new Date(offerExpiryDate) > new Date() ? offerPrice : price;
  const hasActiveOffer = offerPrice && offerExpiryDate && new Date(offerExpiryDate) > new Date();
  const daysRemaining = hasActiveOffer ? getDaysRemaining(offerExpiryDate!) : 0;

  // Update component state when props change (after data refresh)
  useEffect(() => {
    setEditPrice(price.toString());
    setEditOfferPrice(offerPrice?.toString() || "");
    setEditOfferExpiryDate(
      offerExpiryDate ? new Date(offerExpiryDate).toISOString().slice(0, 10) : ""
    );
  }, [price, offerPrice, offerExpiryDate]);

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

  return (
    <Card className={`product-card w-full ${hasActiveOffer ? 'ring-2 ring-orange-400 bg-orange-50' : ''}`}>
      <CardContent className="p-3 sm:p-4">
        {hasActiveOffer && (
          <div className="flex items-center gap-1.5 mb-2 text-orange-600">
            <Tag className="h-3 w-3 flex-shrink-0" />
            <span className="text-xs font-medium">🔥 OFFER</span>
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
              {daysRemaining > 0 ? `${daysRemaining}d left` : 'Today'}
            </Badge>
          </div>
        )}
        <div className="flex items-start gap-2">
          {/* Product Image */}
          <img
            src={getImageUrl(img)}
            alt={title}
            className="w-11 h-11 sm:w-14 sm:h-14 object-cover rounded-md flex-shrink-0"
            loading="lazy"
          />
          
          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm sm:text-base font-semibold truncate pr-1">{title}</h3>
            <div className="flex flex-wrap gap-x-1.5 gap-y-0 mt-0.5 text-[10px] sm:text-xs text-gray-600">
              <span>Case:{caseSize}</span>
              <span>Pkt:{packetSize}</span>
              <span>Rtl:{retailSize}</span>
              {aiel && <span>Aisle:{aiel}</span>}
            </div>
            {/* Barcodes inline */}
            <div className="flex flex-wrap gap-1 mt-0.5">
              <span className="text-[9px] text-gray-500">{barcode}</span>
              {caseBarcode && <span className="text-[9px] text-gray-400">| {caseBarcode}</span>}
            </div>
          </div>
          
          {/* Price + Edit - Right column */}
          {!isEditing && (
            <div className="text-right flex-shrink-0 flex flex-col items-end">
              <span className={`text-base sm:text-lg font-bold ${hasActiveOffer ? 'text-orange-600' : 'text-green-600'}`}>
                £{currentPrice.toFixed(2)}
              </span>
              {hasActiveOffer && (
                <div className="text-[9px] text-gray-500 line-through">
                  Was: £{price.toFixed(2)}
                </div>
              )}
              {rrp && (
                <div className="text-[9px] text-gray-400">
                  RRP: £{rrp.toFixed(2)}
                </div>
              )}
              <Button
                variant={hasActiveOffer ? "default" : "outline"}
                size="sm"
                onClick={() => setIsEditing(true)}
                className={`mt-1 h-5 px-2 text-[10px] ${hasActiveOffer ? 'bg-orange-600 hover:bg-orange-700' : ''}`}
              >
                Edit
              </Button>
            </div>
          )}
        </div>

        {/* Edit Form - Shows when editing */}
        {isEditing && (
          <div className="space-y-2 w-full mt-3">
            <div>
              <label className="text-xs text-gray-600">Regular Price (e.g. 456 = £4.56)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
                <Input
                  type="text"
                  value={editPrice}
                  onChange={(e) => handlePriceInputChange(e.target.value, setEditPrice)}
                  className="w-full pl-7"
                  placeholder="e.g. 456 = £4.56"
                />
              </div>
            </div>
            
            <div>
              <label className="text-xs text-gray-600">
                Offer Price {hasActiveOffer ? '- Currently Active' : '- Optional'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
                <Input
                  type="text"
                  value={editOfferPrice}
                  onChange={(e) => handlePriceInputChange(e.target.value, setEditOfferPrice)}
                  className={`w-full pl-7 ${hasActiveOffer ? 'border-orange-400 bg-orange-50' : ''}`}
                  placeholder="e.g. 399 = £3.99"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-600">
                Offer Expires {hasActiveOffer ? '- Currently Active' : ''}
              </label>
              <Input
                type="date"
                value={editOfferExpiryDate}
                onChange={(e) => setEditOfferExpiryDate(e.target.value)}
                className={`w-full ${hasActiveOffer ? 'border-orange-400 bg-orange-50' : ''}`}
              />
            </div>

            {hasActiveOffer && (
              <div className="text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to clear this offer?')) {
                      setEditOfferPrice("");
                      setEditOfferExpiryDate("");
                      // Immediately save the changes to clear the offer
                      const newPrice = parseFloat(editPrice);
                      if (!isNaN(newPrice) && newPrice > 0) {
                        onOfferUpdate(productId, newPrice, null, null);
                        setIsEditing(false);
                      }
                    }
                  }}
                  className="text-red-600 hover:text-red-800 text-xs"
                >
                  Clear Offer
                </Button>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                className="flex-1"
              >
                Save
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};