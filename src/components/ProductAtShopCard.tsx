import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Tag, DollarSign, Clock } from "lucide-react";

interface ProductAtShopCardProps {
  productId: string;
  shopId: string;
  title: string;
  caseSize: string;
  packetSize: string;
  retailSize: string;
  barcode: string;
  caseBarcode: string | null;
  img: string[] | null;
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
    offerExpiryDate ? new Date(offerExpiryDate).toISOString().slice(0, 16) : ""
  );

  const fallbackImg = "https://via.placeholder.com/64";
  const currentPrice = offerPrice && offerExpiryDate && new Date(offerExpiryDate) > new Date() ? offerPrice : price;
  const hasActiveOffer = offerPrice && offerExpiryDate && new Date(offerExpiryDate) > new Date();
  const daysRemaining = hasActiveOffer ? getDaysRemaining(offerExpiryDate!) : 0;

  // Update component state when props change (after data refresh)
  useEffect(() => {
    setEditPrice(price.toString());
    setEditOfferPrice(offerPrice?.toString() || "");
    setEditOfferExpiryDate(
      offerExpiryDate ? new Date(offerExpiryDate).toISOString().slice(0, 16) : ""
    );
  }, [price, offerPrice, offerExpiryDate]);

  const handleSave = () => {
    const newPrice = parseFloat(editPrice);
    const newOfferPrice = editOfferPrice && editOfferPrice.trim() !== '' ? parseFloat(editOfferPrice) : null;
    const newOfferExpiryDate = editOfferExpiryDate && editOfferExpiryDate.trim() !== '' ? editOfferExpiryDate : null;

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

    // Validate that expiry date is in the future
    if (newOfferExpiryDate && new Date(newOfferExpiryDate) <= new Date()) {
      alert('Offer expiry date must be in the future');
      return;
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
      <CardContent className="p-4">
        {hasActiveOffer && (
          <div className="flex items-center gap-2 mb-3 text-orange-600">
            <Tag className="h-4 w-4" />
            <span className="text-sm font-medium">🔥 SPECIAL OFFER ACTIVE</span>
            <Badge variant="destructive" className="text-xs">
              {daysRemaining > 0 ? `${daysRemaining} days left` : 'Expires today'}
            </Badge>
          </div>
        )}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          {/* Product Info */}
          <div className="flex items-center space-x-3 sm:space-x-4 flex-grow min-w-0">
            <img
              src={img ? (Array.isArray(img) ? img[0] : img) : fallbackImg}
              alt={title}
              className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-md flex-shrink-0"
              loading="lazy"
            />
            <div className="flex-grow min-w-0">
              <h3 className="text-sm sm:text-lg font-semibold truncate">{title}</h3>
              <div className="flex flex-wrap gap-1 sm:gap-2 mt-1 text-xs sm:text-sm text-gray-600">
                <span>Case: {caseSize}</span>
                <span className="hidden sm:inline">•</span>
                <span>Packet: {packetSize}</span>
                <span className="hidden sm:inline">•</span>
                <span>Retail: {retailSize}</span>
                {aiel && (
                  <>
                    <span className="hidden sm:inline">•</span>
                    <span>Aile: {aiel}</span>
                  </>
                )}
              </div>
              <div className="flex flex-wrap gap-1 sm:gap-2 mt-1">
                <Badge variant="secondary" className="text-xs px-1 py-0">
                  {barcode}
                </Badge>
                {caseBarcode && (
                  <Badge variant="outline" className="text-xs px-1 py-0">
                    Case: {caseBarcode}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Price and Offer Section */}
          <div className="flex flex-col sm:items-end space-y-2 min-w-0 w-full sm:w-auto">
            {!isEditing ? (
              <>
                {/* Price Display */}
                <div className="text-left sm:text-right w-full sm:w-auto">
                  <div className="flex items-center gap-2 justify-start sm:justify-end">
                    <DollarSign className={`h-3 w-3 sm:h-4 sm:w-4 ${hasActiveOffer ? 'text-orange-600' : 'text-green-600'}`} />
                    <span className={`text-base sm:text-lg font-bold ${hasActiveOffer ? 'text-orange-600' : 'text-green-600'}`}>
                      £{currentPrice.toFixed(2)}
                    </span>
                    {hasActiveOffer && (
                      <Badge variant="destructive" className="text-xs animate-pulse">
                        OFFER
                      </Badge>
                    )}
                  </div>
                  {hasActiveOffer && (
                    <div className="text-xs sm:text-sm text-gray-500 line-through">
                      Was: £{price.toFixed(2)}
                    </div>
                  )}
                  {rrp && (
                    <div className="text-xs text-gray-400">
                      RRP: £{rrp.toFixed(2)}
                    </div>
                  )}
                </div>

                {/* Offer Status */}
                {hasActiveOffer && (
                  <div className="text-left sm:text-center w-full sm:w-auto">
                    <Badge variant="destructive" className="mb-1">
                      <Tag className="h-3 w-3 mr-1" />
                      OFFER
                    </Badge>
                    <div className="text-xs text-orange-600 flex items-center gap-1 justify-start sm:justify-center">
                      <Clock className="h-3 w-3" />
                      {daysRemaining > 0 ? `${daysRemaining} days left` : 'Expires today'}
                    </div>
                    <div className="text-xs text-gray-500">
                      Until: {formatDate(offerExpiryDate!)}
                    </div>
                  </div>
                )}

                {/* Edit Button */}
                <Button
                  variant={hasActiveOffer ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className={`mt-2 w-full sm:w-auto ${hasActiveOffer ? 'bg-orange-600 hover:bg-orange-700' : ''}`}
                >
                  <span className="hidden sm:inline">{hasActiveOffer ? 'Edit Offer' : 'Edit Price'}</span>
                  <span className="sm:hidden">Edit</span>
                </Button>
              </>
            ) : (
              <>
                {/* Edit Form */}
                <div className="space-y-2 w-full sm:min-w-48">
                  <div>
                    <label className="text-xs text-gray-600">Regular Price (£)</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      className="w-full"
                      placeholder="Regular price"
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-600">
                      Offer Price (£) {hasActiveOffer ? '- Currently Active' : '- Optional'}
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editOfferPrice}
                      onChange={(e) => setEditOfferPrice(e.target.value)}
                      className={`w-full ${hasActiveOffer ? 'border-orange-400 bg-orange-50' : ''}`}
                      placeholder="Offer price"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-600">
                      Offer Expires {hasActiveOffer ? '- Currently Active' : ''}
                    </label>
                    <Input
                      type="datetime-local"
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
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};