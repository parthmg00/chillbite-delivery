import { useState } from "react";
import {
  Link,
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../../context/AuthContext.jsx";
import { useCart } from "../../context/CartContext.jsx";
import { useWishlist } from "../../context/WishlistContext.jsx";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const { user, isAuthenticated, logout } = useAuth();
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const walletBalance = Number(user?.walletBalance || 0);

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    closeMobileMenu();
    navigate("/");
  };

  const formatWalletBalance = (amount) =>
    Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });

  const getLinkStyle = ({ isActive }) => ({
    ...styles.navLink,
    color: isActive ? "#ff4d4f" : "#374151",
    background: isActive ? "#fff1f2" : "transparent",
  });

  const isWalletActive = location.pathname === "/wallet";

  return (
    <header style={styles.header}>
      <nav style={styles.navbar}>
        <Link
          to="/"
          onClick={closeMobileMenu}
          style={styles.logo}
        >
          <span style={styles.logoIcon}>🍴</span>
          ChillBite
        </Link>

        <button
          type="button"
          onClick={() =>
            setMobileMenuOpen((currentValue) => !currentValue)
          }
          style={styles.mobileMenuButton}
          aria-label="Toggle navigation menu"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? "✕" : "☰"}
        </button>

        <div
          style={{
            ...styles.navigationContainer,
            ...(mobileMenuOpen
              ? styles.navigationContainerOpen
              : {}),
          }}
        >
          <div style={styles.mainLinks}>
            <NavLink
              to="/"
              onClick={closeMobileMenu}
              style={getLinkStyle}
            >
              Home
            </NavLink>

            <NavLink
              to="/products"
              onClick={closeMobileMenu}
              style={getLinkStyle}
            >
              Products
            </NavLink>

            <NavLink
              to="/wishlist"
              onClick={closeMobileMenu}
              style={getLinkStyle}
            >
              <span>Wishlist</span>

              {wishlistCount > 0 && (
                <span style={styles.countBadge}>
                  {wishlistCount > 99 ? "99+" : wishlistCount}
                </span>
              )}
            </NavLink>

            {isAuthenticated && (
              <>
                <NavLink
                  to="/orders"
                  onClick={closeMobileMenu}
                  style={getLinkStyle}
                >
                  Orders
                </NavLink>

                <NavLink
                  to="/wallet"
                  onClick={closeMobileMenu}
                  style={() => ({
                    ...styles.walletLink,
                    ...(isWalletActive
                      ? styles.walletLinkActive
                      : {}),
                  })}
                >
                  <span style={styles.walletIcon}>₹</span>

                  <span style={styles.walletText}>
                    <small style={styles.walletLabel}>
                      Wallet
                    </small>

                    <strong style={styles.walletAmount}>
                      ₹{formatWalletBalance(walletBalance)}
                    </strong>
                  </span>
                </NavLink>
              </>
            )}
          </div>

          <div style={styles.accountSection}>
            {!isAuthenticated ? (
              <>
                <NavLink
                  to="/login"
                  onClick={closeMobileMenu}
                  style={getLinkStyle}
                >
                  Login
                </NavLink>

                <NavLink
                  to="/register"
                  onClick={closeMobileMenu}
                  style={({ isActive }) => ({
                    ...styles.registerButton,
                    background: isActive
                      ? "#e53e40"
                      : "#fff0ed",
                    color: isActive
                      ? "#ffffff"
                      : "#ff4d4f",
                  })}
                >
                  Register
                </NavLink>
              </>
            ) : (
              <div style={styles.userArea}>
                <div style={styles.userInfo}>
                  <div style={styles.avatar}>
                    {String(user?.name || "U")
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div style={styles.userText}>
                    <small style={styles.greeting}>
                      Welcome
                    </small>

                    <strong style={styles.userName}>
                      {user?.name || "User"}
                    </strong>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  style={styles.logoutButton}
                >
                  Logout
                </button>
              </div>
            )}

            <NavLink
              to="/cart"
              onClick={closeMobileMenu}
              style={({ isActive }) => ({
                ...styles.cartButton,
                background: isActive
                  ? "#e53e40"
                  : "#ff4d4f",
              })}
            >
              <span style={styles.cartIcon}>🛒</span>
              Cart

              <span style={styles.cartBadge}>
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            </NavLink>
          </div>
        </div>
      </nav>
    </header>
  );
}

const styles = {
  header: {
    position: "sticky",
    top: 0,
    zIndex: 1000,
    width: "100%",
    background: "rgba(255, 255, 255, 0.97)",
    borderBottom: "1px solid #eeeeee",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
    backdropFilter: "blur(12px)",
    fontFamily: "Arial, sans-serif",
  },

  navbar: {
    position: "relative",
    width: "100%",
    maxWidth: "1250px",
    minHeight: "74px",
    margin: "0 auto",
    padding: "12px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "24px",
    boxSizing: "border-box",
  },

  logo: {
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    gap: "9px",
    color: "#ff4d4f",
    textDecoration: "none",
    fontSize: "28px",
    fontWeight: "900",
    letterSpacing: "-1px",
  },

  logoIcon: {
    width: "38px",
    height: "38px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "12px",
    background:
      "linear-gradient(135deg, #ff4d4f, #ff8a4c)",
    color: "#ffffff",
    fontSize: "19px",
    boxShadow: "0 7px 17px rgba(255, 77, 79, 0.25)",
  },

  mobileMenuButton: {
    display: "none",
    width: "42px",
    height: "42px",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    background: "#ffffff",
    color: "#374151",
    fontSize: "21px",
    fontWeight: "900",
    cursor: "pointer",
  },

  navigationContainer: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "20px",
  },

  navigationContainerOpen: {
    display: "flex",
  },

  mainLinks: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },

  navLink: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    padding: "9px 11px",
    borderRadius: "9px",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "700",
    whiteSpace: "nowrap",
  },

  countBadge: {
    minWidth: "19px",
    height: "19px",
    padding: "0 5px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "999px",
    background: "#ff4d4f",
    color: "#ffffff",
    fontSize: "10px",
    fontWeight: "900",
    boxSizing: "border-box",
  },

  walletLink: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    padding: "7px 11px",
    border: "1px solid #fed7d7",
    borderRadius: "12px",
    background: "#fff8f5",
    color: "#374151",
    textDecoration: "none",
    whiteSpace: "nowrap",
  },

  walletLinkActive: {
    borderColor: "#ff4d4f",
    background: "#fff1f2",
    boxShadow: "0 5px 15px rgba(255, 77, 79, 0.12)",
  },

  walletIcon: {
    width: "31px",
    height: "31px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "9px",
    background: "#ff4d4f",
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: "900",
  },

  walletText: {
    display: "flex",
    flexDirection: "column",
    lineHeight: "1.1",
  },

  walletLabel: {
    marginBottom: "3px",
    color: "#9ca3af",
    fontSize: "9px",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: "0.7px",
  },

  walletAmount: {
    color: "#1f2937",
    fontSize: "13px",
  },

  accountSection: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
  },

  registerButton: {
    padding: "10px 15px",
    borderRadius: "9px",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "800",
    whiteSpace: "nowrap",
  },

  userArea: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
  },

  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  avatar: {
    flexShrink: 0,
    width: "35px",
    height: "35px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    background:
      "linear-gradient(135deg, #ff4d4f, #ff8a4c)",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: "900",
  },

  userText: {
    display: "flex",
    flexDirection: "column",
    maxWidth: "110px",
    lineHeight: "1.1",
  },

  greeting: {
    marginBottom: "3px",
    color: "#9ca3af",
    fontSize: "9px",
    fontWeight: "700",
    textTransform: "uppercase",
  },

  userName: {
    overflow: "hidden",
    color: "#374151",
    fontSize: "12px",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  logoutButton: {
    padding: "8px 7px",
    border: "none",
    background: "transparent",
    color: "#dc2626",
    fontSize: "13px",
    fontWeight: "800",
    cursor: "pointer",
  },

  cartButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    padding: "11px 14px",
    borderRadius: "10px",
    color: "#ffffff",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "900",
    whiteSpace: "nowrap",
    boxShadow: "0 6px 16px rgba(255, 77, 79, 0.2)",
  },

  cartIcon: {
    fontSize: "14px",
  },

  cartBadge: {
    minWidth: "21px",
    height: "21px",
    padding: "0 5px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "999px",
    background: "#ffffff",
    color: "#ff4d4f",
    fontSize: "10px",
    fontWeight: "900",
    boxSizing: "border-box",
  },
};

export default Navbar;