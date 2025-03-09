

import { useState, useEffect } from "react";

const useFetchProducts = (searchQuery, filters = {}, page = 1, limit = 10) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Build query parameters
        const params = new URLSearchParams();
        
        if (searchQuery) {
          params.append('search', searchQuery);
        }
        
        // Add filter parameters
        Object.entries(filters).forEach(([key, value]) => {
          if (value === true) {
            params.append(key, 'true');
          }
        });
        
        // Add pagination parameters
        params.append('page', page.toString());
        params.append('limit', limit.toString());
        
        // For debugging
        // console.log(`Fetching from: http://localhost:3000/api/filterProducts?${params.toString()}`);
        
        const auth_token = localStorage.getItem('auth_token');
        const response = await fetch(`http://localhost:3000/api/filterProducts?${params.toString()}`,{
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(auth_token && { Authorization: `Bearer ${auth_token}` }),
          },
           credentials: 'include'
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("API Error:", errorText);
          throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Check the structure of the response data
        console.log("API Response:", data);
        
        // Handle different response formats
        if (Array.isArray(data)) {
          // Old API format (just an array of products)
          setProducts(data);
          setPagination({
            total: data.length,
            page: page,
            limit: limit,
            totalPages: Math.ceil(data.length / limit)
          });
        } else if (data.products && Array.isArray(data.products)) {
          // New API format with pagination
          setProducts(data.products);
          setPagination(data.pagination);
        } else {
          console.error("Unexpected API response format:", data);
          throw new Error("Unexpected API response format");
        }
      } catch (err) {
        console.error("Error fetching products:", err);
        setError(err.message || "Failed to fetch products");
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    // Add debounce to avoid too many requests
    const timer = setTimeout(() => {
      fetchProducts();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, JSON.stringify(filters), page, limit]); // Re-run when pagination changes

  return { products, loading, error, pagination };
};

export default useFetchProducts;
