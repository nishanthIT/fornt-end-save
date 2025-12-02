
import { useState, useEffect } from "react";

const useFetchProductsAtShop = (shopId, refreshTrigger = 0) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProducts = async () => {
    if (!shopId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const auth_token = localStorage.getItem('auth_token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api"}/shop/${shopId}/products`,{
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(auth_token && { Authorization: `Bearer ${auth_token}` }),
        },
         credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Check if the response has a products property
      if (data && data.products) {
        setProducts(data.products);
      } else {
        // If response format is different, adjust accordingly
        setProducts(data || []);
      }
      
      setError(null);
    } catch (err) {
      console.error("Error fetching products:", err);
      setError(err.message);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [shopId, refreshTrigger]);

  return { products, loading, error, refetch: fetchProducts };
};

export default useFetchProductsAtShop;
