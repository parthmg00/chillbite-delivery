import { Link, NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext.jsx";
import { useCart } from "../../context/CartContext.jsx";
import { useWishlist } from "../../context/WishlistContext.jsx";

function Navbar() {
  const navigate = useNavigate();

  const { user, isAuthenticated, logout } = useAuth();
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();

  const getLinkStyle = ({ isActive }) => ({
    textDecoration: "none",
    color: isActive ? "#ff4d4f" : "#374151",
    fontWeight: isActive ? "800" : "600",
    padding: "8px 2px",
  });

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 1000,
        background: "#ffffff",
        borderBottom: "1px solid #eeeeee",
        boxShadow: "0 4px 18px rgba(0, 0, 0, 0.05)",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <nav
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "20px",
          flexWrap: "wrap",
        }}
      >
        <Link
          to="/"
          style={{
            color: "#ff4d4f",
            textDecoration: "none",
            fontSize: "29px",
            fontWeight: "900",
          }}
        >
          ChillBite
        </Link>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >
          <NavLink to="/" style={getLinkStyle}>
            Home
          </NavLink>

          <NavLink to="/products" style={getLinkStyle}>
            Products
          </NavLink>

          <NavLink to="/wishlist" style={getLinkStyle}>
            Wishlist ({wishlistCount})
          </NavLink>

          {isAuthenticated && (
            <NavLink to="/orders" style={getLinkStyle}>
              Orders
            </NavLink>
          )}

          {!isAuthenticated ? (
            <>
              <NavLink to="/login" style={getLinkStyle}>
                Login
              </NavLink>

              <NavLink
                to="/register"
                style={({ isActive }) => ({
                  textDecoration: "none",
                  padding: "10px 15px",
                  borderRadius: "9px",
                  background: isActive ? "#e53e40" : "#fff0ed",
                  color: isActive ? "#ffffff" : "#ff4d4f",
                  fontWeight: "800",
                })}
              >
                Register
              </NavLink>
            </>
          ) : (
            <>
              <span
                style={{
                  color: "#374151",
                  fontWeight: "700",
                }}
              >
                Hi, {user?.name || "User"}
              </span>

              <button
                type="button"
                onClick={handleLogout}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#dc2626",
                  fontWeight: "800",
                  cursor: "pointer",
                }}
              >
                Logout
              </button>
            </>
          )}

          <NavLink
            to="/cart"
            style={({ isActive }) => ({
              textDecoration: "none",
              padding: "11px 17px",
              borderRadius: "10px",
              background: isActive ? "#e53e40" : "#ff4d4f",
              color: "#ffffff",
              fontWeight: "800",
            })}
          >
            Cart ({cartCount})
          </NavLink>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;