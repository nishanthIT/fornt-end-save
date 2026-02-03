
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { OptimizedScanner } from "@/components/OptimizedScanner";
import { toast } from "sonner";

interface ProductCardProps {
  id: string;
  title: string;
  caseSize: string;
  packetSize: string;
  img: string[] | null;
  barcode: string;
  caseBarcode: string | null;
  retailSize: string;
  availability?: number;
  onClick?: () => void;
  price?: number;
  offerPrice?: number;
  offerExpiryDate?: string;
}

export const ProductCardshop = ({
  id,
  title,
  caseSize,
  packetSize,
  img,
  barcode,
  caseBarcode,
  retailSize,
  availability = 1,
  onClick,
  price,
  offerPrice,
  offerExpiryDate,
}: ProductCardProps) => {
  const navigate = useNavigate();
  const { id: shopId } = useParams();
  const location = useLocation();
  const isInShopDetail = location.pathname.includes("/shop/");
  const [open, setOpen] = useState(false);
  const [barcodeValue, setBarcodeValue] = useState(""); 
  const [priceInput, setPriceInput] = useState("");
  const [aiel, setaiel] = useState("");
  const [rrp, setRrp] = useState("");
  const [offerPriceValue, setOfferPriceValue] = useState("");
  const [offerExpiryDateValue, setOfferExpiryDateValue] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(true);
  };

  const handleProductClick = () => {
    if (onClick) {
      onClick();
    } else if (!isInShopDetail) {
      navigate(`/product/${id}`);
    }
  };

  const employeeId = 3;

  const handleSubmit = async () => {
    const prd_details = {
      casebarcode: barcodeValue,
      price: priceInput,
      aiel,
      shopId,
      employeeId,
      id,
      rrp,
      offerPrice: offerPriceValue,
      offerExpiryDate: offerExpiryDateValue
    };

    const authToken = localStorage.getItem("auth_token");
    try {
      setUploading(true);
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api"}/addProductAtShopifExistAtProduct`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { Authorization: `Bearer ${authToken}` })
        },
        body: JSON.stringify(prd_details),
         credentials: 'include'
      });

      const result = await response.json();
      setUploading(false);

      if (response.ok) {
        setOpen(false);
        toast.success("Product added successfully");
     
        setBarcodeValue("")
        setPriceInput("")
        setaiel("")
        setRrp("")
        setOfferPriceValue("")
        setOfferExpiryDateValue("")

        
      } else {
        toast.warning(`Error: ${result.error}`);
      }
    } catch (err) {
      console.log("Error:", err);
      toast.warning("An error occurred. Please try again later");
    }

    setOpen(false);
  };

  const fallbackImg = "https://via.placeholder.com/64";

  return (
    <>
      <Card className="product-card glass-card cursor-pointer w-full h-auto min-h-32" onClick={handleProductClick}>
        <CardContent className="p-4 h-full">
          <div className="flex items-center space-x-4 h-full">
            <img
             // src={img && img[0] ? img[0] : fallbackImg}
             src={img ? (Array.isArray(img) ? img[0] : img) : fallbackImg}
              alt={title}
              className="w-16 h-16 object-cover rounded-md flex-shrink-0"
              loading="lazy"
            />
            <div className="flex-grow min-w-0 space-y-1 max-w-full">
              <h3 className="text-lg font-medium truncate">{title}</h3>
              <p className="text-sm text-gray-600 truncate">{packetSize}</p>
              <p className="text-sm text-gray-600 truncate">
                Retail Size: {retailSize} | Case Size: {caseSize}
              </p>
              <div className="flex flex-wrap gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  Barcode: {barcode}
                </Badge>
              </div>
            </div>
            <div className="flex flex-col items-end justify-between h-full flex-shrink-0">
              <Button variant="outline" size="sm" onClick={handleEdit} className="mt-2">
                ADD
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Improved Modal with Responsiveness */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md w-full max-h-[90vh] overflow-hidden">
          <DialogTitle className="text-lg font-medium">Add Product Details</DialogTitle>
          
          <ScrollArea className="max-h-[65vh] pr-3">
            {/* Smaller, responsive barcode scanner */}
            <div className="w-full h-40 mb-4 overflow-hidden rounded-md border">
              <OptimizedScanner
                width="100%"
                height="100%"
                onScan={(result) => setBarcodeValue(result)}
              />
            </div>
            
            <div className="space-y-3">
              {/* Barcode Input */}
              <Input
                type="text"
                placeholder="Enter or Scan casebarcode"
                value={barcodeValue}
                onChange={(e) => setBarcodeValue(e.target.value)}
              />
              
              {/* Price Input */}
              <Input
                type="number"
                placeholder="Enter Price"
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
              />
              
              {/* Aisle Number Input */}
              <Input
                type="text"
                placeholder="Enter Aisle No"
                value={aiel}
                onChange={(e) => setaiel(e.target.value)}
              />
              
              {/* RRP Input */}
              <Input
                type="number"
                placeholder="Enter RRP"
                value={rrp}
                onChange={(e) => setRrp(e.target.value)}
              />
              
              {/* Offer Price Input */}
              <Input
                type="number"
                placeholder="Enter Offer Price (optional)"
                value={offerPriceValue}
                onChange={(e) => setOfferPriceValue(e.target.value)}
              />
              
              {/* Offer Expiry Date Input */}
              <Input
                type="datetime-local"
                placeholder="Offer Expiry Date"
                value={offerExpiryDateValue}
                onChange={(e) => setOfferExpiryDateValue(e.target.value)}
              />
            </div>
          </ScrollArea>
          
          {/* Fixed buttons at bottom */}
          <div className="flex justify-end gap-2 mt-3 pt-2 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
  onClick={handleSubmit}
  disabled={uploading}
  className="ml-2"
>
  {uploading ? "Submitting..." : "Submit"}
</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
