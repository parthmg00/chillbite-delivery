import { useEffect, useMemo, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import axios from "axios";

import { useCart } from "../context/CartContext.jsx";
import { useWishlist } from "../context/WishlistContext.jsx";

const PRODUCTS_API_URL =
  "http://localhost:5000/api/products";

function getProductId(product) {
  return product?._id || product?.id || "";
}

function getProductImage(product) {
  if (
    Array.isArray(product?.images) &&
    product.images.length > 0
  ) {
    const firstImage = product.images[0];

    if (typeof firstImage === "string") {
      return firstImage;
    }

    return (
      firstImage?.url ||
      firstImage?.secure_url ||
      "https://placehold.co/900x650?text=ChillBite"
    );
  }

  return (
    product?.image ||
    product?.imageUrl ||
    "https://placehold.co/900x650?text=ChillBite"
  );
}

function calculatePrice(product) {
  const price = Number(product?.price) || 0;
  const discount =
    Number(product?.discountPercentage) || 0;

  if (discount <= 0) {
    return price;
  }

  return price - (price * discount) / 100;
}

function getSavedReviews(productId) {
  try {
    const savedReviews = localStorage.getItem(
      `chillbite-reviews-${productId}`
    );

    if (!savedReviews) {
      return [];
    }

    const parsedReviews = JSON.parse(savedReviews);

    return Array.isArray(parsedReviews)
      ? parsedReviews
      : [];
  } catch (error) {
    console.error("Reviews read error:", error);
    return [];
  }
}

function StarRatingInput({
  value,
  onChange,
  disabled = false,
}) {
  return (
    <div style={styles.starInput}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onClick={() => onChange(star)}
          style={{
            ...styles.starButton,
            color:
              star <= value
                ? "#f59e0b"
                : "#d1d5db",
            cursor: disabled
              ? "not-allowed"
              : "pointer",
          }}
          aria-label={`Give ${star} star rating`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function ProductDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { addToCart } = useCart();

  const {
    toggleWishlist,
    isInWishlist,
  } = useWishlist();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [reviewerName, setReviewerName] =
    useState("");
  const [reviewRating, setReviewRating] =
    useState(0);
  const [reviewComment, setReviewComment] =
    useState("");
  const [reviewMessage, setReviewMessage] =
    useState("");

  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoading(true);
        setError("");

        let receivedProduct = null;

        try {
          const response = await axios.get(
            `${PRODUCTS_API_URL}/${id}`
          );

          receivedProduct =
            response.data?.product ||
            response.data?.data?.product ||
            response.data?.data ||
            response.data;
        } catch (singleProductError) {
          console.warn(
            "Single product API unavailable. Using product list fallback.",
            singleProductError
          );

          const response = await axios.get(
            PRODUCTS_API_URL
          );

          const receivedProducts =
            response.data?.products ||
            response.data?.data?.products ||
            response.data?.data ||
            response.data ||
            [];

          if (Array.isArray(receivedProducts)) {
            receivedProduct =
              receivedProducts.find(
                (currentProduct) =>
                  String(
                    getProductId(currentProduct)
                  ) === String(id)
              ) || null;
          }
        }

        if (!receivedProduct) {
          throw new Error("Product not found.");
        }

        setProduct(receivedProduct);
        setReviews(getSavedReviews(id));
      } catch (requestError) {
        console.error(
          "Product details fetch error:",
          requestError
        );

        setError(
          requestError.response?.data?.message ||
            requestError.message ||
            "Product details load nahi hui."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [id]);

  const calculatedReviewData = useMemo(() => {
    const backendRating =
      Number(product?.rating) || 0;

    const backendReviewCount =
      Number(
        product?.numberOfReviews ||
          product?.numReviews ||
          product?.reviewsCount
      ) || 0;

    if (reviews.length === 0) {
      return {
        averageRating: backendRating,
        reviewCount: backendReviewCount,
      };
    }

    const localRatingTotal = reviews.reduce(
      (total, review) =>
        total + Number(review.rating || 0),
      0
    );

    const totalReviewCount =
      backendReviewCount + reviews.length;

    const totalRatingValue =
      backendRating * backendReviewCount +
      localRatingTotal;

    return {
      averageRating:
        totalReviewCount > 0
          ? totalRatingValue /
            totalReviewCount
          : 0,

      reviewCount: totalReviewCount,
    };
  }, [product, reviews]);

  const productId = getProductId(product);

  const productImage =
    getProductImage(product);

  const finalPrice =
    calculatePrice(product);

  const stock =
    Number(product?.stock) || 0;

  const inWishlist = product
    ? isInWishlist(productId)
    : false;

  const handleAddToCart = () => {
    if (!product || stock <= 0) {
      return;
    }

    addToCart(product);
    window.alert(
      `${product.name || "Product"} cart me add ho gaya.`
    );
  };

  const handleWishlist = () => {
    if (!product) {
      return;
    }

    toggleWishlist(product);
  };

  const handleReviewSubmit = (event) => {
    event.preventDefault();
    setReviewMessage("");

    if (!reviewerName.trim()) {
      setReviewMessage(
        "Apna naam enter karo."
      );
      return;
    }

    if (reviewRating < 1) {
      setReviewMessage(
        "Kam se kam 1 star select karo."
      );
      return;
    }

    if (!reviewComment.trim()) {
      setReviewMessage(
        "Review comment enter karo."
      );
      return;
    }

    const newReview = {
      id: `${Date.now()}-${Math.random()}`,
      name: reviewerName.trim(),
      rating: reviewRating,
      comment: reviewComment.trim(),
      createdAt: new Date().toISOString(),
    };

    const updatedReviews = [
      newReview,
      ...reviews,
    ];

    localStorage.setItem(
      `chillbite-reviews-${id}`,
      JSON.stringify(updatedReviews)
    );

    setReviews(updatedReviews);

    setReviewerName("");
    setReviewRating(0);
    setReviewComment("");

    setReviewMessage(
      "Rating successfully submit ho gayi."
    );
  };

  if (loading) {
    return (
      <main style={styles.statusPage}>
        <div style={styles.statusCard}>
          <div style={styles.statusIcon}>
            🍨
          </div>

          <h2 style={styles.statusTitle}>
            Product loading...
          </h2>
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main style={styles.statusPage}>
        <div style={styles.statusCard}>
          <div style={styles.statusIcon}>
            😕
          </div>

          <h1 style={styles.errorTitle}>
            Product nahi mila
          </h1>

          <p style={styles.statusText}>
            {error ||
              "Requested product available nahi hai."}
          </p>

          <Link
            to="/products"
            style={styles.backButton}
          >
            Back to Products
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={styles.simpleBackButton}
        >
          ← Back
        </button>

        <section style={styles.productSection}>
          <div style={styles.imageSection}>
            <div style={styles.imageWrapper}>
              <img
                src={productImage}
                alt={
                  product.name ||
                  product.title ||
                  "Product"
                }
                style={styles.productImage}
                onError={(event) => {
                  event.currentTarget.src =
                    "https://placehold.co/900x650?text=ChillBite";
                }}
              />

              {Number(
                product.discountPercentage
              ) > 0 && (
                <span style={styles.discountBadge}>
                  {product.discountPercentage}% OFF
                </span>
              )}
            </div>
          </div>

          <div style={styles.productInfo}>
            <div style={styles.topMetaRow}>
              <span style={styles.categoryBadge}>
                {product.category ||
                  "Dessert"}
              </span>

              <span style={styles.stockBadge}>
                {stock > 0
                  ? "In Stock"
                  : "Out of Stock"}
              </span>
            </div>

            <h1 style={styles.productTitle}>
              {product.name ||
                product.title ||
                "ChillBite Product"}
            </h1>

            <p style={styles.brand}>
              By{" "}
              {product.brand ||
                "ChillBite"}
            </p>

            <div style={styles.ratingSummary}>
              <span style={styles.ratingNumber}>
                ⭐{" "}
                {calculatedReviewData.averageRating.toFixed(
                  1
                )}
              </span>

              <span style={styles.reviewCount}>
                (
                {
                  calculatedReviewData.reviewCount
                }{" "}
                reviews)
              </span>
            </div>

            <p style={styles.description}>
              {product.description ||
                "Fresh, tasty and delicious ChillBite product."}
            </p>

            <div style={styles.priceBox}>
              <span style={styles.currentPrice}>
                ₹{Math.round(finalPrice)}
              </span>

              {Number(
                product.discountPercentage
              ) > 0 && (
                <span style={styles.oldPrice}>
                  ₹{Number(product.price || 0)}
                </span>
              )}

              {product.unit && (
                <span style={styles.unit}>
                  {product.unit}
                </span>
              )}
            </div>

            <div style={styles.productFacts}>
              <div style={styles.factCard}>
                <span style={styles.factLabel}>
                  Category
                </span>

                <strong style={styles.factValue}>
                  {product.category ||
                    "Dessert"}
                </strong>
              </div>

              <div style={styles.factCard}>
                <span style={styles.factLabel}>
                  Available
                </span>

                <strong style={styles.factValue}>
                  {stock} items
                </strong>
              </div>

              <div style={styles.factCard}>
                <span style={styles.factLabel}>
                  Delivery
                </span>

                <strong style={styles.factValue}>
                  Fast Delivery
                </strong>
              </div>
            </div>

            <div style={styles.actionButtons}>
              <button
                type="button"
                disabled={stock <= 0}
                onClick={handleAddToCart}
                style={{
                  ...styles.cartButton,

                  opacity:
                    stock <= 0 ? 0.5 : 1,

                  cursor:
                    stock <= 0
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                {stock > 0
                  ? "🛒 Add to Cart"
                  : "Unavailable"}
              </button>

              <button
                type="button"
                onClick={handleWishlist}
                style={{
                  ...styles.wishlistButton,

                  background: inWishlist
                    ? "#ff4d4f"
                    : "#ffffff",

                  color: inWishlist
                    ? "#ffffff"
                    : "#ff4d4f",
                }}
              >
                {inWishlist
                  ? "♥ In Wishlist"
                  : "♡ Add to Wishlist"}
              </button>
            </div>
          </div>
        </section>

        <section style={styles.reviewSection}>
          <div style={styles.reviewHeading}>
            <div>
              <p style={styles.eyebrow}>
                CUSTOMER FEEDBACK
              </p>

              <h2 style={styles.sectionTitle}>
                Ratings & Reviews
              </h2>
            </div>

            <div style={styles.largeRatingBox}>
              <strong
                style={styles.largeRatingNumber}
              >
                {calculatedReviewData.averageRating.toFixed(
                  1
                )}
              </strong>

              <span style={styles.largeStars}>
                ★★★★★
              </span>

              <span style={styles.largeReviewText}>
                {
                  calculatedReviewData.reviewCount
                }{" "}
                reviews
              </span>
            </div>
          </div>

          <div style={styles.reviewGrid}>
            <form
              onSubmit={handleReviewSubmit}
              style={styles.reviewForm}
            >
              <h3 style={styles.formTitle}>
                Rate this product
              </h3>

              <p style={styles.formDescription}>
                Product use karne ke baad apna
                experience share karo.
              </p>

              <label style={styles.label}>
                Your Name
              </label>

              <input
                type="text"
                value={reviewerName}
                onChange={(event) =>
                  setReviewerName(
                    event.target.value
                  )
                }
                placeholder="Enter your name"
                style={styles.input}
              />

              <label style={styles.label}>
                Your Rating
              </label>

              <StarRatingInput
                value={reviewRating}
                onChange={setReviewRating}
              />

              <label style={styles.label}>
                Review
              </label>

              <textarea
                value={reviewComment}
                onChange={(event) =>
                  setReviewComment(
                    event.target.value
                  )
                }
                placeholder="Product kaisa laga?"
                rows={5}
                style={styles.textarea}
              />

              {reviewMessage && (
                <p
                  style={{
                    ...styles.reviewMessage,

                    color: reviewMessage.includes(
                      "successfully"
                    )
                      ? "#15803d"
                      : "#dc2626",
                  }}
                >
                  {reviewMessage}
                </p>
              )}

              <button
                type="submit"
                style={styles.submitButton}
              >
                Submit Rating
              </button>
            </form>

            <div style={styles.reviewList}>
              {reviews.length === 0 ? (
                <div style={styles.noReviewsBox}>
                  <div style={styles.noReviewsIcon}>
                    ⭐
                  </div>

                  <h3 style={styles.noReviewsTitle}>
                    No customer reviews yet
                  </h3>

                  <p style={styles.noReviewsText}>
                    Is product ki pehli rating
                    tum de sakte ho.
                  </p>
                </div>
              ) : (
                reviews.map((review) => (
                  <article
                    key={review.id}
                    style={styles.reviewCard}
                  >
                    <div
                      style={styles.reviewCardHeader}
                    >
                      <div>
                        <strong
                          style={styles.reviewerName}
                        >
                          {review.name}
                        </strong>

                        <p
                          style={styles.reviewDate}
                        >
                          {new Date(
                            review.createdAt
                          ).toLocaleString()}
                        </p>
                      </div>

                      <span
                        style={styles.reviewStars}
                      >
                        {"★".repeat(
                          Number(review.rating)
                        )}

                        <span
                          style={
                            styles.emptyReviewStars
                          }
                        >
                          {"★".repeat(
                            5 -
                              Number(
                                review.rating
                              )
                          )}
                        </span>
                      </span>
                    </div>

                    <p
                      style={styles.reviewComment}
                    >
                      {review.comment}
                    </p>
                  </article>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "35px 20px 80px",
    background: "#fffaf8",
    fontFamily: "Arial, sans-serif",
  },

  container: {
    width: "100%",
    maxWidth: "1200px",
    margin: "0 auto",
  },

  simpleBackButton: {
    marginBottom: "22px",
    padding: "10px 15px",
    border: "1px solid #e5e7eb",
    borderRadius: "9px",
    background: "#ffffff",
    color: "#374151",
    fontSize: "14px",
    fontWeight: "800",
    cursor: "pointer",
  },

  productSection: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "45px",
    padding: "32px",
    borderRadius: "24px",
    background: "#ffffff",
    boxShadow:
      "0 16px 45px rgba(31, 41, 55, 0.09)",
  },

  imageSection: {
    minWidth: 0,
  },

  imageWrapper: {
    position: "relative",
    overflow: "hidden",
    height: "100%",
    minHeight: "440px",
    borderRadius: "20px",
    background: "#f3f4f6",
  },

  productImage: {
    width: "100%",
    height: "100%",
    minHeight: "440px",
    display: "block",
    objectFit: "cover",
  },

  discountBadge: {
    position: "absolute",
    top: "18px",
    left: "18px",
    padding: "9px 13px",
    borderRadius: "9px",
    background: "#ff4d4f",
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: "900",
  },

  productInfo: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },

  topMetaRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    marginBottom: "18px",
  },

  categoryBadge: {
    padding: "8px 12px",
    borderRadius: "999px",
    background: "#fff1f2",
    color: "#ff4d4f",
    fontSize: "13px",
    fontWeight: "800",
    textTransform: "capitalize",
  },

  stockBadge: {
    color: "#15803d",
    fontSize: "13px",
    fontWeight: "800",
  },

  productTitle: {
    margin: "0 0 10px",
    color: "#1f2937",
    fontSize: "clamp(32px, 5vw, 48px)",
    lineHeight: "1.15",
  },

  brand: {
    margin: "0 0 17px",
    color: "#ff4d4f",
    fontSize: "15px",
    fontWeight: "800",
  },

  ratingSummary: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    marginBottom: "20px",
  },

  ratingNumber: {
    color: "#b45309",
    fontSize: "18px",
  },

  reviewCount: {
    color: "#6b7280",
    fontSize: "14px",
  },

  description: {
    margin: "0 0 25px",
    color: "#6b7280",
    fontSize: "16px",
    lineHeight: "1.8",
  },

  priceBox: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "25px",
  },

  currentPrice: {
    color: "#111827",
    fontSize: "36px",
    fontWeight: "900",
  },

  oldPrice: {
    color: "#9ca3af",
    fontSize: "20px",
    textDecoration: "line-through",
  },

  unit: {
    color: "#6b7280",
    fontSize: "14px",
  },

  productFacts: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(120px, 1fr))",
    gap: "12px",
    marginBottom: "28px",
  },

  factCard: {
    padding: "14px",
    borderRadius: "12px",
    background: "#f9fafb",
  },

  factLabel: {
    display: "block",
    marginBottom: "5px",
    color: "#9ca3af",
    fontSize: "11px",
    fontWeight: "800",
  },

  factValue: {
    color: "#374151",
    fontSize: "14px",
  },

  actionButtons: {
    display: "flex",
    gap: "13px",
    flexWrap: "wrap",
  },

  cartButton: {
    flex: "1 1 200px",
    padding: "15px 20px",
    border: "none",
    borderRadius: "11px",
    background: "#ff4d4f",
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: "900",
  },

  wishlistButton: {
    flex: "1 1 200px",
    padding: "15px 20px",
    border: "2px solid #ff4d4f",
    borderRadius: "11px",
    fontSize: "15px",
    fontWeight: "900",
    cursor: "pointer",
  },

  reviewSection: {
    marginTop: "35px",
    padding: "32px",
    borderRadius: "24px",
    background: "#ffffff",
    boxShadow:
      "0 16px 45px rgba(31, 41, 55, 0.08)",
  },

  reviewHeading: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "25px",
    marginBottom: "30px",
    flexWrap: "wrap",
  },

  eyebrow: {
    margin: "0 0 7px",
    color: "#ff4d4f",
    fontSize: "12px",
    fontWeight: "900",
    letterSpacing: "1.5px",
  },

  sectionTitle: {
    margin: 0,
    color: "#1f2937",
    fontSize: "30px",
  },

  largeRatingBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "17px 25px",
    borderRadius: "14px",
    background: "#fff8ed",
  },

  largeRatingNumber: {
    color: "#1f2937",
    fontSize: "32px",
  },

  largeStars: {
    color: "#f59e0b",
    letterSpacing: "2px",
  },

  largeReviewText: {
    marginTop: "5px",
    color: "#6b7280",
    fontSize: "12px",
  },

  reviewGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "30px",
  },

  reviewForm: {
    padding: "24px",
    borderRadius: "17px",
    background: "#fff8f5",
  },

  formTitle: {
    margin: "0 0 7px",
    color: "#1f2937",
    fontSize: "23px",
  },

  formDescription: {
    margin: "0 0 21px",
    color: "#6b7280",
    lineHeight: "1.6",
  },

  label: {
    display: "block",
    margin: "15px 0 7px",
    color: "#374151",
    fontSize: "13px",
    fontWeight: "800",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "13px 14px",
    border: "1px solid #d1d5db",
    borderRadius: "9px",
    fontSize: "15px",
    outline: "none",
  },

  textarea: {
    width: "100%",
    boxSizing: "border-box",
    padding: "13px 14px",
    border: "1px solid #d1d5db",
    borderRadius: "9px",
    fontSize: "15px",
    fontFamily: "Arial, sans-serif",
    outline: "none",
    resize: "vertical",
  },

  starInput: {
    display: "flex",
    gap: "4px",
  },

  starButton: {
    padding: 0,
    border: "none",
    background: "transparent",
    fontSize: "34px",
  },

  reviewMessage: {
    margin: "13px 0 0",
    fontSize: "13px",
    fontWeight: "800",
  },

  submitButton: {
    width: "100%",
    marginTop: "18px",
    padding: "14px",
    border: "none",
    borderRadius: "10px",
    background: "#ff4d4f",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: "900",
    cursor: "pointer",
  },

  reviewList: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  reviewCard: {
    padding: "20px",
    border: "1px solid #eeeeee",
    borderRadius: "14px",
    background: "#ffffff",
  },

  reviewCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "14px",
  },

  reviewerName: {
    color: "#1f2937",
    fontSize: "16px",
  },

  reviewDate: {
    margin: "5px 0 0",
    color: "#9ca3af",
    fontSize: "11px",
  },

  reviewStars: {
    color: "#f59e0b",
    whiteSpace: "nowrap",
  },

  emptyReviewStars: {
    color: "#d1d5db",
  },

  reviewComment: {
    margin: "15px 0 0",
    color: "#4b5563",
    lineHeight: "1.7",
  },

  noReviewsBox: {
    padding: "45px 25px",
    border: "1px dashed #d1d5db",
    borderRadius: "16px",
    textAlign: "center",
  },

  noReviewsIcon: {
    fontSize: "45px",
  },

  noReviewsTitle: {
    margin: "12px 0 7px",
    color: "#1f2937",
  },

  noReviewsText: {
    margin: 0,
    color: "#6b7280",
  },

  statusPage: {
    minHeight: "75vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "30px",
    background: "#fff8f5",
    fontFamily: "Arial, sans-serif",
  },

  statusCard: {
    width: "100%",
    maxWidth: "520px",
    padding: "45px",
    borderRadius: "22px",
    background: "#ffffff",
    boxShadow:
      "0 15px 40px rgba(0,0,0,0.08)",
    textAlign: "center",
  },

  statusIcon: {
    fontSize: "55px",
  },

  statusTitle: {
    color: "#1f2937",
  },

  errorTitle: {
    color: "#dc2626",
  },

  statusText: {
    color: "#6b7280",
    lineHeight: "1.6",
  },

  backButton: {
    display: "inline-block",
    marginTop: "15px",
    padding: "12px 18px",
    borderRadius: "9px",
    background: "#ff4d4f",
    color: "#ffffff",
    textDecoration: "none",
    fontWeight: "800",
  },
};

export default ProductDetailsPage;