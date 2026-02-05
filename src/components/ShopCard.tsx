

import { Store, Phone, MapPin, Edit, Trash, AlertTriangle } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Shop {
  id: string;  // id should be a string according to Prisma
  name: string;
  mobile: string;
  address: string;
  totalProducts: number;
}
interface ShopCardProps {
  shop: Shop;
  onClick: () => void;
  onDelete: (id: string) => void;
  onUpdate: (updatedShop: Shop) => void;  // Add the onUpdate prop
}

export const ShopCard = ({ shop, onClick, onDelete, onUpdate }: ShopCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editedShop, setEditedShop] = useState(shop);
  const { user } = useAuth();
  
  const isAdmin = user?.userType === 'ADMIN';

const authToken = localStorage.getItem("auth_token");
  const handleSave = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api"}/editShop/${shop.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(authToken && { Authorization: `Bearer ${authToken}` })
        },
        body: JSON.stringify(editedShop),
         credentials: 'include'
      });

      if (!response.ok) {
        throw new Error("Failed to update shop");
      }

      const updatedShop = await response.json();
      toast.success("Shop details updated successfully!");
      setIsEditing(false);
      onUpdate(updatedShop);  // Update the parent component with the new shop data
    } catch (error) {
      toast.error("Failed to update shop details.");
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer glass-card relative" onClick={onClick}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            <h3 className="font-semibold text-lg">{shop.name}</h3>
          </div>
          <div className="flex gap-2">
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent onClick={(e) => e.stopPropagation()}>
                <DialogHeader>
                  <DialogTitle>Edit Shop Details</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Shop Name</label>
                    <Input
                      value={editedShop.name}
                      onChange={(e) => setEditedShop({ ...editedShop, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Phone Number</label>
                    <Input
                      value={editedShop.mobile}
                      onChange={(e) => setEditedShop({ ...editedShop, mobile: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Address</label>
                    <Input
                      value={editedShop.address}
                      onChange={(e) => setEditedShop({ ...editedShop, address: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleSave} className="w-full">
                    Save Changes
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            {/* Only show delete button for Admin users */}
            {isAdmin && (
              <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Trash className="h-4 w-4 text-red-600" />
                  </Button>
                </DialogTrigger>
                <DialogContent onClick={(e) => e.stopPropagation()}>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                      <AlertTriangle className="h-5 w-5" />
                      Delete Shop
                    </DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete <strong>{shop.name}</strong>? This action cannot be undone and will remove all products associated with this shop.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                      variant="outline"
                      onClick={() => setIsDeleteDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        onDelete(shop.id);
                        setIsDeleteDialogOpen(false);
                      }}
                    >
                      Delete Shop
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
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
