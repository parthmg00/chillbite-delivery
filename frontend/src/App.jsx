import AppRoutes from "./routes/AppRoutes.jsx";

import { AuthProvider } from "./context/AuthContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { WishlistProvider } from "./context/WishlistContext.jsx";

function App() {
  return (
    <AuthProvider>
      <WishlistProvider>
        <CartProvider>
          <AppRoutes />
        </CartProvider>
      </WishlistProvider>
    </AuthProvider>
  );
}

export default App;