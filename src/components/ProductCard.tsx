
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams, useLocation } from "react-router-dom";

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
  availability?: number;
  onClick?: () => void;
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
  availability = 1, // Default availability
  onClick,
}: ProductCardProps) => {
  const navigate = useNavigate();
  const { id: shopId } = useParams();
  const location = useLocation();
  const isInShopDetail = location.pathname.includes("/shop/");
  const isInProductsPage = location.pathname === "/products"; // Check if the current route is /products

  const handleEdit = (e: React.MouseEvent) => {
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

  // Fallback image URL
  const fallbackImg = "https://www.pngfind.com/pngs/m/131-1312918_png-file-svg-product-icon-transparent-png.png";

  return (
    <Card
      className="product-card glass-card cursor-pointer w-full h-auto min-h-32"
      onClick={handleProductClick} // Handle click on the entire card
    >
      <CardContent className="p-4 h-full">
        <div className="flex items-center space-x-4 h-full">
          <img
            //src={img && img[0] ? img[0] : fallbackImg}
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
          {/* Conditionally render the "ADD" button */}
          {!isInProductsPage && (
            <div className="flex flex-col items-end justify-between h-full flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
                className="mt-2"
              >
                ADD
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};