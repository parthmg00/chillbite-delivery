import { Link, useNavigate } from "react-router-dom";

import { useCart } from "../context/CartContext.jsx";

function getProductId(product) {
  return product?._id || product?.id;
}

function getProductImage(product) {
  if (Array.isArray(product?.images) && product.images.length > 0) {
    const firstImage = product.images[0];

    if (typeof firstImage === "string") {
      return firstImage;
    }

    return firstImage?.url || firstImage?.secure_url;
  }

  return (
    product?.image ||
    product?.imageUrl ||
    "https://placehold.co/300x250?text=ChillBite"
  );
}

function getFinalPrice(product) {
  const price = Number(product.price) || 0;
  const discount = Number(product.discountPercentage) || 0;

  return discount > 0
    ? price - (price * discount) / 100
    : price;
}

function CartPage() {
  const navigate = useNavigate();

  const {
    cartItems,
    cartCount,
    cartTotal,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  const deliveryCharge = cartTotal >= 499 || cartTotal === 0 ? 0 : 40;
  const finalTotal = cartTotal + deliveryCharge;

  if (cartItems.length === 0) {
    return (
      <section style={styles.emptyPage}>
        <div style={styles.emptyCard}>
          <div style={styles.emptyIcon}>🛒</div>

          <h1 style={styles.emptyTitle}>Your cart is empty</h1>

          <p style={styles.emptyText}>
            Products page par jaakar apni favourite items add karo.
          </p>

          <Link to="/products" style={styles.shopButton}>
            Explore Products
          </Link>
        </div>
      </section>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <div style={styles.titleRow}>
          <div>
            <p style={styles.label}>YOUR ORDER</p>
            <h1 style={styles.heading}>Shopping Cart</h1>
          </div>

          <button
            type="button"
            onClick={clearCart}
            style={styles.clearButton}
          >
            Clear Cart
          </button>
        </div>

        <div style={styles.layout}>
          <section style={styles.itemsSection}>
            {cartItems.map((item) => {
              const productId = getProductId(item);
              const finalPrice = getFinalPrice(item);

              return (
                <article key={productId} style={styles.itemCard}>
                  <img
                    src={getProductImage(item)}
                    alt={item.name || item.title}
                    style={styles.image}
                  />

                  <div style={styles.itemInfo}>
                    <p style={styles.category}>
                      {item.category || "Dessert"}
                    </p>

                    <h2 style={styles.productName}>
                      {item.name || item.title}
                    </h2>

                    <p style={styles.unit}>{item.unit || ""}</p>

                    <p style={styles.price}>
                      ₹{Math.round(finalPrice)}
                    </p>
                  </div>

                  <div style={styles.actions}>
                    <div style={styles.quantityBox}>
                      <button
                        type="button"
                        onClick={() => decreaseQuantity(productId)}
                        style={styles.quantityButton}
                      >
                        −
                      </button>

                      <span style={styles.quantity}>
                        {item.quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() => increaseQuantity(productId)}
                        style={styles.quantityButton}
                      >
                        +
                      </button>
                    </div>

                    <p style={styles.itemTotal}>
                      ₹{Math.round(finalPrice * item.quantity)}
                    </p>

                    <button
                      type="button"
                      onClick={() => removeFromCart(productId)}
                      style={styles.removeButton}
                    >
                      Remove
                    </button>
                  </div>
                </article>
              );
            })}
          </section>

          <aside style={styles.summary}>
            <h2 style={styles.summaryTitle}>Order Summary</h2>

            <div style={styles.summaryRow}>
              <span>Items ({cartCount})</span>
              <span>₹{Math.round(cartTotal)}</span>
            </div>

            <div style={styles.summaryRow}>
              <span>Delivery</span>
              <span>
                {deliveryCharge === 0
                  ? "Free"
                  : `₹${deliveryCharge}`}
              </span>
            </div>

            <div style={styles.divider} />

            <div style={styles.totalRow}>
              <span>Total</span>
              <span>₹{Math.round(finalTotal)}</span>
            </div>

            {cartTotal < 499 && (
              <p style={styles.deliveryMessage}>
                Free delivery ke liye ₹
                {Math.round(499 - cartTotal)} aur add karo.
              </p>
            )}

            <button
              type="button"
              onClick={() => navigate("/checkout")}
              style={styles.checkoutButton}
            >
              Proceed to Checkout
            </button>

            <Link to="/products" style={styles.continueLink}>
              Continue Shopping
            </Link>
          </aside>
        </div>
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "60px 20px 80px",
    background: "#fff8f5",
    fontFamily: "Arial, sans-serif",
  },

  container: {
    maxWidth: "1200px",
    margin: "0 auto",
  },

  titleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "end",
    gap: "20px",
    marginBottom: "35px",
    flexWrap: "wrap",
  },

  label: {
    margin: "0 0 7px",
    color: "#ff4d4f",
    fontWeight: "800",
    letterSpacing: "1.5px",
    fontSize: "13px",
  },

  heading: {
    margin: 0,
    color: "#1f2937",
    fontSize: "42px",
  },

  clearButton: {
    padding: "11px 16px",
    border: "1px solid #fecaca",
    borderRadius: "9px",
    background: "#ffffff",
    color: "#dc2626",
    fontWeight: "700",
    cursor: "pointer",
  },

  layout: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 2fr) minmax(280px, 1fr)",
    gap: "28px",
    alignItems: "start",
  },

  itemsSection: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },

  itemCard: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
    padding: "18px",
    background: "#ffffff",
    borderRadius: "18px",
    boxShadow: "0 10px 30px rgba(31, 41, 55, 0.07)",
    flexWrap: "wrap",
  },

  image: {
    width: "130px",
    height: "110px",
    objectFit: "cover",
    borderRadius: "13px",
    background: "#f3f4f6",
  },

  itemInfo: {
    flex: "1 1 220px",
  },

  category: {
    margin: "0 0 5px",
    color: "#ff4d4f",
    fontSize: "12px",
    fontWeight: "800",
    textTransform: "capitalize",
  },

  productName: {
    margin: "0 0 7px",
    color: "#1f2937",
    fontSize: "21px",
  },

  unit: {
    margin: "0 0 9px",
    color: "#6b7280",
    fontSize: "13px",
  },

  price: {
    margin: 0,
    color: "#111827",
    fontSize: "19px",
    fontWeight: "800",
  },

  actions: {
    minWidth: "150px",
    textAlign: "right",
  },

  quantityBox: {
    display: "inline-flex",
    alignItems: "center",
    overflow: "hidden",
    border: "1px solid #e5e7eb",
    borderRadius: "9px",
  },

  quantityButton: {
    width: "36px",
    height: "36px",
    border: "none",
    background: "#f9fafb",
    color: "#1f2937",
    fontSize: "20px",
    cursor: "pointer",
  },

  quantity: {
    minWidth: "38px",
    textAlign: "center",
    fontWeight: "800",
  },

  itemTotal: {
    margin: "12px 0 8px",
    color: "#1f2937",
    fontSize: "18px",
    fontWeight: "900",
  },

  removeButton: {
    padding: 0,
    border: "none",
    background: "transparent",
    color: "#dc2626",
    fontWeight: "700",
    cursor: "pointer",
  },

  summary: {
    position: "sticky",
    top: "100px",
    padding: "28px",
    background: "#ffffff",
    borderRadius: "20px",
    boxShadow: "0 12px 35px rgba(31, 41, 55, 0.08)",
  },

  summaryTitle: {
    margin: "0 0 24px",
    color: "#1f2937",
    fontSize: "25px",
  },

  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    marginBottom: "17px",
    color: "#6b7280",
  },

  divider: {
    height: "1px",
    margin: "23px 0",
    background: "#e5e7eb",
  },

  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    color: "#111827",
    fontSize: "22px",
    fontWeight: "900",
  },

  deliveryMessage: {
    margin: "18px 0 0",
    padding: "11px",
    borderRadius: "9px",
    background: "#fff7ed",
    color: "#c2410c",
    fontSize: "13px",
    lineHeight: "1.5",
  },

  checkoutButton: {
    width: "100%",
    marginTop: "24px",
    padding: "14px",
    border: "none",
    borderRadius: "11px",
    background: "#ff4d4f",
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: "800",
    cursor: "pointer",
  },

  continueLink: {
    display: "block",
    marginTop: "17px",
    color: "#ff4d4f",
    textAlign: "center",
    textDecoration: "none",
    fontWeight: "700",
  },

  emptyPage: {
    minHeight: "70vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "40px 20px",
    background: "#fff8f5",
    fontFamily: "Arial, sans-serif",
  },

  emptyCard: {
    width: "100%",
    maxWidth: "550px",
    padding: "55px 30px",
    background: "#ffffff",
    borderRadius: "22px",
    textAlign: "center",
    boxShadow: "0 14px 40px rgba(0, 0, 0, 0.08)",
  },

  emptyIcon: {
    fontSize: "70px",
  },

  emptyTitle: {
    margin: "15px 0 10px",
    color: "#1f2937",
    fontSize: "34px",
  },

  emptyText: {
    margin: "0 0 27px",
    color: "#6b7280",
    fontSize: "17px",
    lineHeight: "1.6",
  },

  shopButton: {
    display: "inline-block",
    padding: "14px 25px",
    borderRadius: "10px",
    background: "#ff4d4f",
    color: "#ffffff",
    textDecoration: "none",
    fontWeight: "800",
  },
};

export default CartPage;