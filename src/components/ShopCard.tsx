import { Store, Phone, MapPin, Edit } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";

interface Shop {
  id: number;
  name: string;
  mobile: string;
  address: string;
  totalProducts:number;
}

interface ShopCardProps {
  shop: Shop;
  onClick: () => void;
}

export const ShopCard = ({ shop, onClick }: ShopCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedShop, setEditedShop] = useState(shop);

  const handleSave = () => {
    // Here you would typically make an API call to update the shop
    toast.success("Shop details updated successfully!");
    setIsEditing(false);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  return (
    <Card 
      className="hover:shadow-lg transition-shadow cursor-pointer glass-card relative"
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            <h3 className="font-semibold text-lg">{shop.name}</h3>
          </div>
          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2"
                onClick={handleEdit}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Shop Details</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Shop Name</label>
                  <Input
                    value={editedShop.name}
                    onChange={(e) =>
                      setEditedShop({ ...editedShop, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone Number</label>
                  <Input
                    value={editedShop.mobile}
                    onChange={(e) =>
                      setEditedShop({ ...editedShop, mobile: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Address</label>
                  <Input
                    value={editedShop.address}
                    onChange={(e) =>
                      setEditedShop({ ...editedShop, address: e.target.value })
                    }
                  />
                </div>
                <Button onClick={handleSave} className="w-full">
                  Save Changes
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-4 w-4" />
            <span>{shop.mobile}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{shop.address}</span>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            <span>{shop.totalProducts} </span>products available
          </div>
        </div>
      </CardContent>
    </Card>
  );
};