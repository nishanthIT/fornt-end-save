
// import { Card, CardContent } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { useNavigate, useParams, useLocation } from "react-router-dom";

// interface ProductCardProps {
//   id: string;
//   title: string;
//   productUrl: string;
//   caseSize: string;
//   packetSize: string;
//   img: string[] | null; // Updated to allow null
//   barcode: string;
//   caseBarcode: string | null;
//   retailSize: string;
//   availability?: number;
//   onClick?: () => void;
// }

// export const ProductCardshop = ({
//   id,
//   title,
//   productUrl,
//   caseSize,
//   packetSize,
//   img,
//   barcode,
//   caseBarcode,
//   retailSize,
//   availability = 1, // Default availability
//   onClick,
// }: ProductCardProps) => {
//   const navigate = useNavigate();
//   const { id: shopId } = useParams();
//   const location = useLocation();
//   const isInShopDetail = location.pathname.includes("/shop/");

//   const handleEdit = (e: React.MouseEvent) => {
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

//   // Fallback image URL
//   const fallbackImg = "https://via.placeholder.com/64";

//   return (
//     <Card className="product-card glass-card cursor-pointer w-full h-auto min-h-32">
//     <CardContent className="p-4 h-full">
//       <div className="flex items-center space-x-4 h-full">
//         <img
//           src={img && img[0] ? img[0] : fallbackImg}
//           alt={title}
//           className="w-16 h-16 object-cover rounded-md flex-shrink-0"
//           loading="lazy"
//         />
//         <div className="flex-grow min-w-0 space-y-1 max-w-full">
//           <h3 className="text-lg font-medium truncate">{title}</h3>
//           <p className="text-sm text-gray-600 truncate">{packetSize}</p>
//           <p className="text-sm text-gray-600 truncate">
//             Retail Size: {retailSize} | Case Size: {caseSize}
//           </p>
//           <div className="flex flex-wrap gap-2 mt-1">
//             <Badge variant="secondary" className="text-xs">
//               Barcode: {barcode}
//             </Badge>
//             {/* <Badge
//               variant={availability > 0 ? "default" : "destructive"}
//               className="text-xs"
//             >
//               {availability > 0 ? "In Stock" : "Out of Stock"}
//             </Badge> */}
//           </div>
//         </div>
//         <div className="flex flex-col items-end justify-between h-full flex-shrink-0">
//           <Button
//             variant="outline"
//             size="sm"
//             onClick={handleEdit}
//             className="mt-2"
//           >
//             ADD
//           </Button>
//         </div>
//       </div>
//     </CardContent>
//   </Card>
//   );
// };


import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import BarcodeScanner from "react-qr-barcode-scanner"; // Install if needed

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
}: ProductCardProps) => {
  const navigate = useNavigate();
  const { id: shopId } = useParams();
  const location = useLocation();
  const isInShopDetail = location.pathname.includes("/shop/");
  const [open, setOpen] = useState(false);
  const [barcodeValue, setBarcodeValue] = useState(""); // Single barcode field
  const [price, setPrice] = useState("");
  const [aiel, setaiel] = useState("");

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

  const handleSubmit =async () => {

   const prd_details = {
    casebarcode: barcodeValue, // Single field for both scan & manual entry
    price,
    aiel,
    shopId,
    employeeId,
    id

   }

   console.log(prd_details);
   try{
    const response = await fetch('http://localhost:3000/api/addProductAtShopifExistAtProduct', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(prd_details),
    });
   


    const result = await response.json();

    if (response.ok) {
      alert("Product added successfully");
  
    }else{
      alert(`Error: ${result.error}`);
   }
 
  }catch(err) {
    console.log("Error:", err);
    alert("An error occured. Please try again later")
  }




    console.log({
      barcode: barcodeValue, // Single field for both scan & manual entry
      price,
      aiel,
    });
    setOpen(false);
  };

  const fallbackImg = "https://via.placeholder.com/64";

  return (
    <>
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

      {/* Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>Add Product Details</DialogTitle>

          {/* Barcode Scanner */}
          <BarcodeScanner
            onUpdate={(err, result) => {
              if (result) setBarcodeValue(result.text); // Updates barcode input field
            }}
            delay={500}
          />

          {/* Barcode Input (Updates on scan or manual entry) */}
          <Input
            type="text"
            placeholder="Enter or Scan casebarcode"
            value={barcodeValue}
            onChange={(e) => setBarcodeValue(e.target.value)} // Updates field manually
            className="mt-2"
          />

          {/* Price Input */}
          <Input
            type="number"
            placeholder="Enter Price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="mt-2"
          />

          {/* Aisle Number Input */}
          <Input
            type="text"
            placeholder="Enter Aisle No"
            value={aiel}
            onChange={(e) => setaiel(e.target.value)}
            className="mt-2"
          />

          {/* Buttons */}
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} className="ml-2">Submit</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
