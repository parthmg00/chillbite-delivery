import { Link } from "react-router-dom";

import { useCart } from "../context/CartContext.jsx";
import { useWishlist } from "../context/WishlistContext.jsx";

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
    "https://placehold.co/600x400?text=ChillBite"
  );
}

function getFinalPrice(product) {
  const price = Number(product.price) || 0;
  const discount = Number(product.discountPercentage) || 0;

  return discount > 0
    ? price - (price * discount) / 100
    : price;
}

function WishlistPage() {
  const { addToCart } = useCart();

  const {
    wishlistItems,
    removeFromWishlist,
    clearWishlist,
  } = useWishlist();

  if (wishlistItems.length === 0) {
    return (
      <section style={styles.emptyPage}>
        <div style={styles.emptyCard}>
          <div style={styles.emptyIcon}>♡</div>

          <h1 style={styles.emptyTitle}>
            Your wishlist is empty
          </h1>

          <p style={styles.emptyText}>
            Products page par heart button dabakar products save karo.
          </p>

          <Link to="/products" style={styles.exploreButton}>
            Explore Products
          </Link>
        </div>
      </section>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <p style={styles.label}>SAVED PRODUCTS</p>

            <h1 style={styles.heading}>My Wishlist</h1>

            <p style={styles.subheading}>
              {wishlistItems.length} products saved
            </p>
          </div>

          <button
            type="button"
            onClick={clearWishlist}
            style={styles.clearButton}
          >
            Clear Wishlist
          </button>
        </div>

        <div style={styles.grid}>
          {wishlistItems.map((product) => {
            const productId = getProductId(product);
            const finalPrice = getFinalPrice(product);
            const stock = Number(product.stock) || 0;

            return (
              <article key={productId} style={styles.card}>
                <div style={styles.imageWrapper}>
                  <img
                    src={getProductImage(product)}
                    alt={product.name || product.title}
                    style={styles.image}
                  />

                  <button
                    type="button"
                    onClick={() => removeFromWishlist(productId)}
                    style={styles.removeIcon}
                    title="Remove from wishlist"
                  >
                    ×
                  </button>
                </div>

                <div style={styles.cardContent}>
                  <p style={styles.category}>
                    {product.category || "Dessert"}
                  </p>

                  <h2 style={styles.productName}>
                    {product.name || product.title}
                  </h2>

                  <p style={styles.description}>
                    {product.description ||
                      "Fresh and delicious product."}
                  </p>

                  <div style={styles.priceRow}>
                    <span style={styles.price}>
                      ₹{Math.round(finalPrice)}
                    </span>

                    {Number(product.discountPercentage) > 0 && (
                      <span style={styles.oldPrice}>
                        ₹{product.price}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={stock <= 0}
                    onClick={() => {
                      addToCart(product);
                      removeFromWishlist(productId);
                    }}
                    style={{
                      ...styles.cartButton,
                      opacity: stock <= 0 ? 0.5 : 1,
                      cursor:
                        stock <= 0 ? "not-allowed" : "pointer",
                    }}
                  >
                    {stock > 0
                      ? "Move to Cart"
                      : "Out of Stock"}
                  </button>
                </div>
              </article>
            );
          })}
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

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "end",
    gap: "20px",
    marginBottom: "38px",
    flexWrap: "wrap",
  },

  label: {
    margin: "0 0 7px",
    color: "#ff4d4f",
    fontSize: "13px",
    fontWeight: "800",
    letterSpacing: "1.5px",
  },

  heading: {
    margin: "0 0 8px",
    color: "#1f2937",
    fontSize: "42px",
  },

  subheading: {
    margin: 0,
    color: "#6b7280",
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

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(270px, 1fr))",
    gap: "25px",
  },

  card: {
    overflow: "hidden",
    background: "#ffffff",
    borderRadius: "20px",
    boxShadow: "0 12px 35px rgba(31, 41, 55, 0.08)",
  },

  imageWrapper: {
    position: "relative",
    height: "225px",
    overflow: "hidden",
    background: "#f3f4f6",
  },

  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  removeIcon: {
    position: "absolute",
    top: "13px",
    right: "13px",
    width: "40px",
    height: "40px",
    border: "none",
    borderRadius: "50%",
    background: "#ffffff",
    color: "#dc2626",
    fontSize: "25px",
    cursor: "pointer",
    boxShadow: "0 6px 18px rgba(0, 0, 0, 0.16)",
  },

  cardContent: {
    padding: "21px",
  },

  category: {
    margin: "0 0 9px",
    color: "#ff4d4f",
    fontSize: "13px",
    fontWeight: "800",
    textTransform: "capitalize",
  },

  productName: {
    margin: "0 0 10px",
    color: "#1f2937",
    fontSize: "22px",
  },

  description: {
    minHeight: "44px",
    margin: "0 0 18px",
    color: "#6b7280",
    lineHeight: "1.55",
    fontSize: "14px",
  },

  priceRow: {
    marginBottom: "18px",
  },

  price: {
    color: "#111827",
    fontSize: "24px",
    fontWeight: "900",
  },

  oldPrice: {
    marginLeft: "9px",
    color: "#9ca3af",
    textDecoration: "line-through",
  },

  cartButton: {
    width: "100%",
    padding: "13px",
    border: "none",
    borderRadius: "11px",
    background: "#ff4d4f",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: "800",
  },

  emptyPage: {
    minHeight: "70vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
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
    color: "#ff4d4f",
    fontSize: "85px",
    lineHeight: 1,
  },

  emptyTitle: {
    margin: "18px 0 10px",
    color: "#1f2937",
    fontSize: "34px",
  },

  emptyText: {
    margin: "0 0 27px",
    color: "#6b7280",
    fontSize: "17px",
    lineHeight: "1.6",
  },

  exploreButton: {
    display: "inline-block",
    padding: "14px 25px",
    borderRadius: "10px",
    background: "#ff4d4f",
    color: "#ffffff",
    textDecoration: "none",
    fontWeight: "800",
  },
};

export default WishlistPage;