import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";

interface ShopAvailabilityProps {
  shop: {
    id: number;
    name: string;
    location: string;
    price: number;
    stock: number;
  };
}

export const ShopAvailability = ({ shop }: ShopAvailabilityProps) => {
  return (
    <Card className="glass-card fade-in">
      <CardHeader>
        <CardTitle className="text-lg font-medium">{shop.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center text-muted-foreground">
            <MapPin className="w-4 h-4 mr-2" />
            <span>{shop.location}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xl font-semibold">£{shop.price}</span>
            <Badge variant={shop.stock > 0 ? "default" : "destructive"}>
              {shop.stock > 0 ? `${shop.stock} in stock` : "Out of stock"}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
