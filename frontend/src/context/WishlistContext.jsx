import { createContext, useContext, useEffect, useState } from "react";

const WishlistContext = createContext(null);

function getProductId(product) {
  return product?._id || product?.id;
}

export function WishlistProvider({ children }) {
  const [wishlistItems, setWishlistItems] = useState(() => {
    try {
      const savedWishlist = localStorage.getItem("chillbite-wishlist");

      return savedWishlist ? JSON.parse(savedWishlist) : [];
    } catch (error) {
      console.error("Wishlist read error:", error);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        "chillbite-wishlist",
        JSON.stringify(wishlistItems)
      );
    } catch (error) {
      console.error("Wishlist save error:", error);
    }
  }, [wishlistItems]);

  const isInWishlist = (productId) => {
    return wishlistItems.some(
      (item) => getProductId(item) === productId
    );
  };

  const addToWishlist = (product) => {
    const productId = getProductId(product);

    if (!productId) {
      console.error("Product ID missing:", product);
      return;
    }

    setWishlistItems((currentItems) => {
      const alreadyExists = currentItems.some(
        (item) => getProductId(item) === productId
      );

      if (alreadyExists) {
        return currentItems;
      }

      return [...currentItems, product];
    });
  };

  const removeFromWishlist = (productId) => {
    setWishlistItems((currentItems) =>
      currentItems.filter((item) => getProductId(item) !== productId)
    );
  };

  const toggleWishlist = (product) => {
    const productId = getProductId(product);

    if (!productId) {
      return;
    }

    if (isInWishlist(productId)) {
      removeFromWishlist(productId);
    } else {
      addToWishlist(product);
    }
  };

  const clearWishlist = () => {
    setWishlistItems([]);
  };

  const value = {
    wishlistItems,
    wishlistCount: wishlistItems.length,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    isInWishlist,
    clearWishlist,
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);

  if (!context) {
    throw new Error(
      "useWishlist must be used inside WishlistProvider"
    );
  }

  return context;
}