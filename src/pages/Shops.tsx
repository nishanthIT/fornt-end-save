


import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShopCard } from "@/components/ShopCard";
import { AddShopDialog } from "@/components/AddShopDialog";
import useFetchShops from "@/hooks/useFetchShops";

import { toast } from "sonner";
import axios from "axios";
import api from "@/utils/axiosInstance";

const Shops = () => {
  const [isAddShopOpen, setIsAddShopOpen] = useState(false);
  const [shops, setShops] = useState([]);
  const navigate = useNavigate();
  const { shops: initialShops, loading, error } = useFetchShops();

  // Initialize shops state on first render
  useEffect(() => {
    setShops(initialShops);
  }, [initialShops]);

  // Callback to add a new shop
  const handleAddShop = (newShop) => {
    setShops((prevShops) => [newShop, ...prevShops]);
  };


  const handleUpdateShop = (updatedShop: Shop) => {
    setShops((prevShops) =>
      prevShops.map((shop) =>
        shop.id === updatedShop.id ? updatedShop : shop
      )
    ); // Update the specific shop in the list
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/shops/${id}`);
      toast.success("Shop deleted successfully!");
      // Update the shops state to remove the deleted shop
      setShops((prevShops) => prevShops.filter((shop) => shop.id !== id));
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete shop");
    }
  };


  if (loading) {
    return <div className="text-center">Loading shops...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Shops</h1>
        <Button onClick={() => setIsAddShopOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Shop
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {shops.map((shop) => (
          <ShopCard
            key={shop.id}
            shop={shop}
            onClick={() => navigate(`/shop/${shop.id}`)}
            onDelete={handleDelete}
            onUpdate={handleUpdateShop}  // Pass the update handler to the ShopCard
          />
        ))}
      </div>

      <AddShopDialog
        open={isAddShopOpen}
        onOpenChange={setIsAddShopOpen}
        onShopAdded={handleAddShop} // Pass the callback to the dialog
      />
    </div>
  );
};

export default Shops;
