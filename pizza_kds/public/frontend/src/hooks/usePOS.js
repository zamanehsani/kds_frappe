import { useState, useCallback } from "react";

export function usePOS() {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadMenu = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/method/pizza_app.api.get_menu_items");
      const data = await response.json();

      if (data.message) {
        setMenuItems(data.message);
      } else {
        throw new Error("Failed to load menu items");
      }
    } catch (err) {
      setError(err.message);
      console.error("Error loading menu:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    menuItems,
    loading,
    error,
    loadMenu,
  };
}
