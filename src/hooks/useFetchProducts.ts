

import { useState, useEffect, useRef } from "react";

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
  
  // Use ref to track if component is mounted
  const isMountedRef = useRef(true);
  // Use ref to track the latest request
  const latestRequestRef = useRef(0);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const fetchProducts = async (requestId: number) => {
      // Don't search if query is too short (less than 2 characters)
      const trimmedQuery = searchQuery?.trim() || '';
      if (trimmedQuery.length > 0 && trimmedQuery.length < 2) {
        setProducts([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        // Build query parameters
        const params = new URLSearchParams();
        
        if (trimmedQuery) {
          params.append('search', trimmedQuery);
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
        
        const auth_token = localStorage.getItem('auth_token');
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api"}/filterProducts?${params.toString()}`,{
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(auth_token && { Authorization: `Bearer ${auth_token}` }),
          },
           credentials: 'include'
        });
        
        // Check if this is still the latest request and component is mounted
        if (requestId !== latestRequestRef.current || !isMountedRef.current) {
          return;
        }
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("API Error:", errorText);
          throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
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
        // Only set error if this is still the latest request
        if (requestId === latestRequestRef.current && isMountedRef.current) {
          console.error("Error fetching products:", err);
          setError(err.message || "Failed to fetch products");
          setProducts([]);
        }
      } finally {
        // Only set loading false if this is still the latest request
        if (requestId === latestRequestRef.current && isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    // Increment request ID to track latest request
    const requestId = ++latestRequestRef.current;

    // Debounce: 500ms delay for better UX while typing
    const timer = setTimeout(() => {
      fetchProducts(requestId);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, JSON.stringify(filters), page, limit]);

  return { products, loading, error, pagination };
};

export default useFetchProducts;
