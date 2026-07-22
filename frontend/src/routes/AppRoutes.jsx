import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import MainLayout from "../layouts/MainLayout.jsx";

import HomePage from "../pages/HomePage.jsx";
import ProductsPage from "../pages/ProductsPage.jsx";
import ProductDetailsPage from "../pages/ProductDetailsPage.jsx";
import CartPage from "../pages/CartPage.jsx";
import WishlistPage from "../pages/WishlistPage.jsx";
import LoginPage from "../pages/LoginPage.jsx";
import RegisterPage from "../pages/RegisterPage.jsx";
import CheckoutPage from "../pages/CheckoutPage.jsx";
import OrderSuccessPage from "../pages/OrderSuccessPage.jsx";
import MyOrdersPage from "../pages/MyOrdersPage.jsx";

import { useAuth } from "../context/AuthContext.jsx";

function ProtectedRoute({ children }) {
  const location = useLocation();

  const { isAuthenticated } =
    useAuth();

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location,
        }}
      />
    );
  }

  return children;
}

function NotFoundPage() {
  return (
    <main
      style={{
        minHeight: "75vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "30px",
        background: "#fff8f5",
        fontFamily:
          "Arial, sans-serif",
      }}
    >
      <div
        style={{
          textAlign: "center",
        }}
      >
        <h1
          style={{
            margin: 0,
            color: "#ff4d4f",
            fontSize: "60px",
          }}
        >
          404
        </h1>

        <p
          style={{
            color: "#6b7280",
          }}
        >
          Page not found.
        </p>
      </div>
    </main>
  );
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          element={<MainLayout />}
        >
          <Route
            path="/"
            element={<HomePage />}
          />

          <Route
            path="/products"
            element={<ProductsPage />}
          />

          <Route
            path="/products/:id"
            element={
              <ProductDetailsPage />
            }
          />

          <Route
            path="/cart"
            element={<CartPage />}
          />

          <Route
            path="/wishlist"
            element={<WishlistPage />}
          />

          <Route
            path="/login"
            element={<LoginPage />}
          />

          <Route
            path="/register"
            element={<RegisterPage />}
          />

          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/order-success/:id"
            element={
              <ProtectedRoute>
                <OrderSuccessPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <MyOrdersPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="*"
            element={
              <NotFoundPage />
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;