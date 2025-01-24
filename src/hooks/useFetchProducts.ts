import { useState, useEffect } from "react";
import axios from "axios";

interface Product {
  id: string;
  title: string;
  productUrl: string;
  caseSize: string;
  packetSize: string;
  img: string[];
  barcode: string;
  caseBarcode: string | null;
  retailSize: string;
}

interface UseFetchProductsResult {
  products: Product[];
  loading: boolean;
  error: string | null;
}

const BASE_URL = "http://localhost:3000/api";

const useFetchProducts = (searchQuery: string): UseFetchProductsResult => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!searchQuery) {
      setProducts([]);
      return;
    }

    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get<Product[]>(`${BASE_URL}/filterProducts`, {
          params: { search: searchQuery },
        });
        setProducts(response.data);
       
      } catch (err) {
        setError("Failed to fetch products");
       
      } finally {
        setLoading(false);
      }
    };

    fetchProducts(); // Immediately fetch products without delay
  }, [searchQuery]);

  return { products, loading, error };
};

export default useFetchProducts;
