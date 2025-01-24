// import { Card, CardContent } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { useNavigate, useParams, useLocation } from "react-router-dom";

// interface ProductCardProps {
//   id: number;
//   title: string;
//   category: string;
//   price: number;
//   productUrl: string;
//   availability: number;
//   onClick?: () => void;
// }

// export const ProductCard = ({ id, title, category, price, img, availability, onClick }: ProductCardProps) => {
//   const navigate = useNavigate();
//   const { id: shopId } = useParams();
//   const location = useLocation();
//   const isInShopDetail = location.pathname.includes('/shop/');

//   const handlePriceEdit = (e: React.MouseEvent) => {
//     e.stopPropagation();
//     navigate(`/shop/${shopId}/product/${id}`);
//   };

//   const handleProductClick = () => {
//     if (onClick) {
//       onClick();
//     } else if (!isInShopDetail) {
//       navigate(`/product/${id}`);
//     }
//   };

//   return (
//     <Card 
//       className="product-card glass-card cursor-pointer w-full h-24" 
//       onClick={handleProductClick}
//     >
//       <CardContent className="p-4 h-full">
//         <div className="flex items-center space-x-4 h-full">
//           <img
//             src={img[0]}
//             alt={title}
//             className="w-16 h-16 object-cover rounded-md flex-shrink-0"
//             loading="lazy"
//           />
//           <div className="flex-grow min-w-0">
//             <h3 className="text-lg font-medium truncate">{title}</h3>
//             <div className="flex flex-wrap gap-2 mt-1">
//               <Badge variant="secondary" className="text-xs">
//                 {category}
//               </Badge>
//               <Badge 
//                 variant={availability > 0 ? "default" : "destructive"}
//                 className="text-xs"
//               >
//                 {availability > 0 ? "In Stock" : "Out of Stock"}
//               </Badge>
//             </div>
//           </div>
//           <div className="flex flex-col items-end justify-between h-full flex-shrink-0">
//             <span className="text-lg font-semibold">${price}</span>
//             {isInShopDetail && (
//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={handlePriceEdit}
//                 className="mt-2"
//               >
//                 Change Price
//               </Button>
//             )}
//           </div>
//         </div>
//       </CardContent>
//     </Card>
//   );
// };

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

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/shop/${shopId}/product/${id}`);
  };

  const handleProductClick = () => {
    if (onClick) {
      onClick();
    } else if (!isInShopDetail) {
      navigate(`/product/${id}`);
    }
  };

  // Fallback image URL
  const fallbackImg = "https://via.placeholder.com/64";

  return (
    <Card className="product-card glass-card cursor-pointer w-full h-auto min-h-32">
    <CardContent className="p-4 h-full">
      <div className="flex items-center space-x-4 h-full">
        <img
          src={img && img[0] ? img[0] : fallbackImg}
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
            {/* <Badge
              variant={availability > 0 ? "default" : "destructive"}
              className="text-xs"
            >
              {availability > 0 ? "In Stock" : "Out of Stock"}
            </Badge> */}
          </div>
        </div>
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
      </div>
    </CardContent>
  </Card>
  );
};
