


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
    return (
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600 dark:text-gray-400">Loading shops...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-red-500">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Shops</h1>
        <Button onClick={() => setIsAddShopOpen(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" /> Add Shop
        </Button>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
