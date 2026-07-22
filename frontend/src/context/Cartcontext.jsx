import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const CartContext = createContext(null);

function getProductId(product) {
  return product?._id || product?.id;
}

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const savedCart = localStorage.getItem("chillbite-cart");
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error("Cart read error:", error);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("chillbite-cart", JSON.stringify(cartItems));
    } catch (error) {
      console.error("Cart save error:", error);
    }
  }, [cartItems]);

  const addToCart = (product) => {
    const productId = getProductId(product);

    if (!productId) {
      console.error("Product ID missing:", product);
      return;
    }

    setCartItems((currentItems) => {
      const existingItem = currentItems.find(
        (item) => getProductId(item) === productId
      );

      if (existingItem) {
        return currentItems.map((item) =>
          getProductId(item) === productId
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item
        );
      }

      return [
        ...currentItems,
        {
          ...product,
          quantity: 1,
        },
      ];
    });
  };

  const removeFromCart = (productId) => {
    setCartItems((currentItems) =>
      currentItems.filter((item) => getProductId(item) !== productId)
    );
  };

  const increaseQuantity = (productId) => {
    setCartItems((currentItems) =>
      currentItems.map((item) =>
        getProductId(item) === productId
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item
      )
    );
  };

  const decreaseQuantity = (productId) => {
    setCartItems((currentItems) =>
      currentItems
        .map((item) =>
          getProductId(item) === productId
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartCount = useMemo(() => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  }, [cartItems]);

  const cartTotal = useMemo(() => {
    return cartItems.reduce((total, item) => {
      const price = Number(item.price) || 0;

      const discount = Number(item.discountPercentage) || 0;

      const finalPrice =
        discount > 0 ? price - (price * discount) / 100 : price;

      return total + finalPrice * item.quantity;
    }, 0);
  }, [cartItems]);

  const value = {
    cartItems,
    cartCount,
    cartTotal,
    addToCart,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    clearCart,
  };

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
}