import { useState, useEffect } from "react";
import axios from "axios";
import { log } from "console";

interface ShopProduct {
  title: string;
  retailSize: string;
  caseSize: string;
  price: number;
  productId: string;
}

interface UseFetchProductsAtShopResult {
  products: ShopProduct[];
  loading: boolean;
  error: string | null;
}

const BASE_URL = "http://localhost:3000/api"; // Update as needed

const useFetchProductsAtShop = (shopId: string): UseFetchProductsAtShopResult => {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!shopId) return;

      setLoading(true);
      setError(null);
      try {
        const response = await axios.get<ShopProduct[]>(`${BASE_URL}/ProductAtShop/${shopId}`,);
        setProducts(response.data);
      } catch (err) {
        console.log(err);
        setError("Failed to fetch products");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [shopId]);

  return { products, loading, error };
};

export default useFetchProductsAtShop;
