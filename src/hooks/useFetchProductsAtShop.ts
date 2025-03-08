// import { useState, useEffect } from "react";
// import axios from "axios";
// import { log } from "console";

// interface ShopProduct {
//   title: string;
//   retailSize: string;
//   caseSize: string;
//   price: number;
//   productId: string;
// }

// interface UseFetchProductsAtShopResult {
//   products: ShopProduct[];
//   loading: boolean;
//   error: string | null;
// }

// const BASE_URL = "http://localhost:3000/api"; // Update as needed

// const useFetchProductsAtShop = (shopId: string): UseFetchProductsAtShopResult => {
//   const [products, setProducts] = useState<ShopProduct[]>([]);
//   const [loading, setLoading] = useState<boolean>(false);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     const fetchProducts = async () => {
//       if (!shopId) return;

//       setLoading(true);
//       setError(null);
//       try {
//         const response = await axios.get<ShopProduct[]>(`${BASE_URL}/ProductAtShop/${shopId}`,);
//         setProducts(response.data);
//       } catch (err) {
//         console.log(err);
//         setError("Failed to fetch products");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchProducts();
//   }, [shopId]);

//   return { products, loading, error };
// };

// export default useFetchProductsAtShop;
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
      const response = await fetch(`http://localhost:3000/api/shop/${shopId}/products`);
      
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