import { log } from "console";
import { console } from "inspector";
import { useState, useEffect } from "react";

const useFetchShopById = (shopId: string) => {
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchShop = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:3000/api/getshop/${shopId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch shop with ID: ${shopId}`);
        }
        const data = await response.json();
        setShop(data);
        // console.log(data);
      } catch (err: any) {
        setError(err.message || "An error occurred while fetching the shop.");
      } finally {
        setLoading(false);
      }
    };

    if (shopId) {
      fetchShop();
    }
  }, [shopId]);

  return { shop, loading, error };
};

export default useFetchShopById;
