import { useState, useEffect } from "react";

const useFetchShops = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const authToken = localStorage.getItem("auth_token");
        const response = await fetch("https://backend.h7tex.com/api/getAllshop",{
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(authToken && { Authorization: `Bearer ${authToken}` }),
          },
           credentials: 'include'
        });
        if (!response.ok) {
          throw new Error("Failed to fetch shops");
        }
        const data = await response.json();
        setShops(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchShops();
  }, []);

  return { shops, loading, error };
};

export default useFetchShops;
