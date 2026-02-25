
import { useState, useEffect, useRef, useCallback } from "react";

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface FetchParams {
  page?: number;
  search?: string;
  category?: string;
  aisle?: string;
}

const useFetchProductsAtShop = (
  shopId: string | undefined, 
  refreshTrigger = 0,
  params: FetchParams = {}
) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 100,
    totalPages: 0
  });
  
  // Use ref for debouncing
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const fetchProducts = useCallback(async (fetchParams?: FetchParams) => {
    if (!shopId) {
      setLoading(false);
      return;
    }

    const currentParams = fetchParams || params;
    
    try {
      setLoading(true);
      const auth_token = localStorage.getItem('auth_token');
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      if (currentParams.page) queryParams.append('page', currentParams.page.toString());
      if (currentParams.search) queryParams.append('search', currentParams.search);
      if (currentParams.category) queryParams.append('category', currentParams.category);
      if (currentParams.aisle) queryParams.append('aisle', currentParams.aisle);
      
      const queryString = queryParams.toString();
      const url = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api"}/shop/${shopId}/products${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url, {
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
        setPagination({
          total: data.total || data.products.length,
          page: data.page || 1,
          limit: data.limit || 100,
          totalPages: data.totalPages || Math.ceil((data.total || data.products.length) / 100)
        });
      } else {
        // If response format is different, adjust accordingly
        setProducts(data || []);
        setPagination({
          total: Array.isArray(data) ? data.length : 0,
          page: 1,
          limit: 100,
          totalPages: 1
        });
      }
      
      setError(null);
    } catch (err: any) {
      console.error("Error fetching products:", err);
      setError(err.message);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [shopId, params.page, params.search, params.category, params.aisle]);

  // Debounced fetch for search
  const debouncedFetch = useCallback((fetchParams: FetchParams) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      fetchProducts(fetchParams);
    }, 300);
  }, [fetchProducts]);

  useEffect(() => {
    // Clean up debounce on unmount
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Use debounced fetch if search is being used
    if (params.search !== undefined) {
      debouncedFetch(params);
    } else {
      fetchProducts(params);
    }
  }, [shopId, refreshTrigger, params.page, params.search, params.category, params.aisle]);

  return { 
    products, 
    loading, 
    error, 
    pagination,
    refetch: fetchProducts 
  };
};

export default useFetchProductsAtShop;
