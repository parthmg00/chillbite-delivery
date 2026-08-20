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
import OrderDetailsPage from "../pages/OrderDetailsPage.jsx";
import WalletPage from "../pages/WalletPage.jsx";
import DeliveryTracking from "../pages/DeliveryTracking.jsx";
import CustomerTracking from "../pages/CustomerTracking.jsx";

import { useAuth } from "../context/AuthContext.jsx";


// ======================================================
// PROTECTED ROUTE
// ======================================================

function ProtectedRoute({ children }) {
  const location = useLocation();
  const { isAuthenticated, authLoading } = useAuth();

  // Authentication loading
  if (authLoading) {
    return (
      <main
        style={{
          minHeight: "75vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "30px",
          background: "#fff8f5",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "45px",
              height: "45px",
              margin: "0 auto 16px",
              border: "4px solid #ffe2df",
              borderTopColor: "#ff4d4f",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />

          <p
            style={{
              margin: 0,
              color: "#6b7280",
              fontWeight: "700",
            }}
          >
            Loading...
          </p>

          <style>
            {`
              @keyframes spin {
                from {
                  transform: rotate(0deg);
                }

                to {
                  transform: rotate(360deg);
                }
              }
            `}
          </style>
        </div>
      </main>
    );
  }

  // User is not logged in
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  // User is authenticated
  return children;
}


// ======================================================
// 404 PAGE
// ======================================================

function NotFoundPage() {
  const location = useLocation();

  return (
    <main
      style={{
        minHeight: "75vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "30px 20px",
        background: "#fff8f5",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "520px",
          padding: "45px 30px",
          borderRadius: "20px",
          background: "#ffffff",
          boxShadow: "0 15px 40px rgba(0, 0, 0, 0.08)",
          textAlign: "center",
        }}
      >
        {/* Food Icon */}
        <div
          style={{
            width: "75px",
            height: "75px",
            margin: "0 auto 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "22px",
            background: "#fff1f2",
            fontSize: "34px",
          }}
        >
          🍽️
        </div>

        {/* 404 */}
        <h1
          style={{
            margin: "0 0 12px",
            color: "#ff4d4f",
            fontSize: "64px",
            lineHeight: 1,
          }}
        >
          404
        </h1>

        {/* Heading */}
        <h2
          style={{
            margin: "0 0 10px",
            color: "#1f2937",
            fontSize: "25px",
          }}
        >
          Page not found
        </h2>

        {/* Message */}
        <p
          style={{
            margin: "0 0 8px",
            color: "#6b7280",
            lineHeight: "1.6",
          }}
        >
          Ye page available nahi hai ya URL galat hai.
        </p>

        {/* Current URL */}
        <p
          style={{
            margin: "0 0 24px",
            color: "#9ca3af",
            fontSize: "13px",
            wordBreak: "break-word",
          }}
        >
          Requested URL: {location.pathname}
        </p>

        {/* Home Button */}
        <a
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "13px 22px",
            borderRadius: "10px",
            background: "#ff4d4f",
            color: "#ffffff",
            textDecoration: "none",
            fontWeight: "800",
          }}
        >
          Go to Home
        </a>
      </section>
    </main>
  );
}


// ======================================================
// APP ROUTES
// ======================================================

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Main Layout */}
        <Route element={<MainLayout />}>

          {/* ==========================================
              PUBLIC ROUTES
          ========================================== */}

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
            element={<ProductDetailsPage />}
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


          {/* ==========================================
              PROTECTED ROUTES
          ========================================== */}

          {/* Checkout */}
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />

          {/* Order Success */}
          <Route
            path="/order-success/:id"
            element={
              <ProtectedRoute>
                <OrderSuccessPage />
              </ProtectedRoute>
            }
          />

          {/* My Orders */}
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <MyOrdersPage />
              </ProtectedRoute>
            }
          />

          {/* Order Details */}
          <Route
            path="/orders/:id"
            element={
              <ProtectedRoute>
                <OrderDetailsPage />
              </ProtectedRoute>
            }
          />

          {/* Wallet */}
          <Route
            path="/wallet"
            element={
              <ProtectedRoute>
                <WalletPage />
              </ProtectedRoute>
            }
          />

          {/* Delivery Tracking */}
          <Route
            path="/delivery/:orderId/track"
            element={
              <ProtectedRoute>
                <DeliveryTracking />
              </ProtectedRoute>
            }
          />

          {/* Customer Tracking */}
          <Route
            path="/order/:orderId/track"
            element={
              <ProtectedRoute>
                <CustomerTracking />
              </ProtectedRoute>
            }
          />


          {/* ==========================================
              404
          ========================================== */}

          <Route
            path="*"
            element={<NotFoundPage />}
          />

        </Route>
      </Routes>
    </BrowserRouter>
  );
}


export default AppRoutes;