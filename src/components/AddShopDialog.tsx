import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
interface AddShopDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShopAdded: (shop: any) => void; // Add this prop
}

export const AddShopDialog = ({
  open,
  onOpenChange,
  onShopAdded,
}: AddShopDialogProps) => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const authToken = localStorage.getItem("auth_token");
    try {
      const response = await fetch("http://localhost:3000/api/addShop", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken && { Authorization: `Bearer ${authToken}` })
        },
        body: JSON.stringify({
          name: formData.name,
          address: formData.address,
          mobile: formData.phone,
        }),
      });

      if (response.ok) {
        const newShop = await response.json();
        onShopAdded(newShop); // Call the callback with the new shop
     
        toast.success("Shop added successfully!");
        setFormData({ name: "", phone: "", address: "" });
        onOpenChange(false);
      } else {
        alert("Failed to add shop. Please try again.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Shop</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Shop Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Shop"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};