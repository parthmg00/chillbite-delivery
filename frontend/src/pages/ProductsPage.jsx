import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import axios from "axios";

import { useCart } from "../context/CartContext.jsx";
import { useWishlist } from "../context/WishlistContext.jsx";

const API_URL =
  "http://localhost:5000/api/products";

function getProductId(product) {
  return product?._id || product?.id;
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
      firstImage?.secure_url
    );
  }

  return (
    product?.image ||
    product?.imageUrl ||
    "https://placehold.co/600x400?text=ChillBite"
  );
}

function calculatePrice(product) {
  const price =
    Number(product?.price) || 0;

  const discount =
    Number(
      product?.discountPercentage
    ) || 0;

  if (discount <= 0) {
    return price;
  }

  return (
    price -
    (price * discount) / 100
  );
}

function getLocalReviewData(productId) {
  try {
    const savedReviews =
      localStorage.getItem(
        `chillbite-reviews-${productId}`
      );

    if (!savedReviews) {
      return {
        averageRating: 0,
        reviewCount: 0,
      };
    }

    const reviews =
      JSON.parse(savedReviews);

    if (
      !Array.isArray(reviews) ||
      reviews.length === 0
    ) {
      return {
        averageRating: 0,
        reviewCount: 0,
      };
    }

    const ratingTotal =
      reviews.reduce(
        (total, review) =>
          total +
          Number(review.rating || 0),
        0
      );

    return {
      averageRating:
        ratingTotal / reviews.length,

      reviewCount: reviews.length,
    };
  } catch (error) {
    console.error(
      "Local reviews read error:",
      error
    );

    return {
      averageRating: 0,
      reviewCount: 0,
    };
  }
}

function ProductsPage() {
  const navigate = useNavigate();

  const { addToCart } = useCart();

  const {
    toggleWishlist,
    isInWishlist,
  } = useWishlist();

  const [products, setProducts] =
    useState([]);

  const [
    searchText,
    setSearchText,
  ] = useState("");

  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState("all");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        setError("");

        const response =
          await axios.get(API_URL);

        const receivedProducts =
          response.data?.products ||
          response.data?.data?.products ||
          response.data?.data ||
          response.data ||
          [];

        setProducts(
          Array.isArray(receivedProducts)
            ? receivedProducts
            : []
        );
      } catch (requestError) {
        console.error(
          "Products fetch error:",
          requestError
        );

        setError(
          requestError.response?.data
            ?.message ||
            "Products load nahi hue. Backend start karo."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  const categories =
    useMemo(() => {
      const categoryNames =
        products
          .map(
            (product) =>
              product.category
          )
          .filter(Boolean);

      return [
        "all",
        ...new Set(categoryNames),
      ];
    }, [products]);

  const filteredProducts =
    useMemo(() => {
      const search =
        searchText
          .trim()
          .toLowerCase();

      return products.filter(
        (product) => {
          const productName =
            (
              product.name ||
              product.title ||
              ""
            ).toLowerCase();

          const productBrand =
            (
              product.brand ||
              ""
            ).toLowerCase();

          const productCategory =
            (
              product.category ||
              ""
            ).toLowerCase();

          const matchesSearch =
            productName.includes(
              search
            ) ||
            productBrand.includes(
              search
            ) ||
            productCategory.includes(
              search
            );

          const matchesCategory =
            selectedCategory ===
              "all" ||
            product.category ===
              selectedCategory;

          return (
            matchesSearch &&
            matchesCategory
          );
        }
      );
    }, [
      products,
      searchText,
      selectedCategory,
    ]);

  const handleAddToCart = (
    event,
    product
  ) => {
    event.stopPropagation();

    addToCart(product);

    window.alert(
      `${
        product.name ||
        product.title ||
        "Product"
      } cart me add ho gaya.`
    );
  };

  const handleWishlist = (
    event,
    product
  ) => {
    event.stopPropagation();

    toggleWishlist(product);
  };

  const openProduct = (
    productId
  ) => {
    if (!productId) {
      window.alert(
        "Product ID available nahi hai."
      );

      return;
    }

    navigate(
      `/products/${productId}`
    );
  };

  if (loading) {
    return (
      <section
        style={styles.statusPage}
      >
        <div
          style={styles.statusCard}
        >
          <div
            style={styles.statusIcon}
          >
            🍨
          </div>

          <h2
            style={{
              color: "#ff4d4f",
            }}
          >
            Products loading...
          </h2>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section
        style={styles.statusPage}
      >
        <div
          style={styles.statusCard}
        >
          <div
            style={styles.statusIcon}
          >
            😕
          </div>

          <h2
            style={{
              color: "#dc2626",
            }}
          >
            Products load nahi hue
          </h2>

          <p
            style={{
              color: "#6b7280",
              lineHeight: "1.6",
            }}
          >
            {error}
          </p>

          <p
            style={{
              color: "#6b7280",
            }}
          >
            Backend folder me{" "}
            <strong>
              npm run dev
            </strong>{" "}
            chalao.
          </p>
        </div>
      </section>
    );
  }

  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <p style={styles.heroLabel}>
          CHILLBITE MENU
        </p>

        <h1 style={styles.heroTitle}>
          Explore Our Products
        </h1>

        <p
          style={
            styles.heroDescription
          }
        >
          Ice creams, waffles, cakes aur
          cold drinks me se apna
          favourite choose karo.
        </p>
      </section>

      <section style={styles.content}>
        <div style={styles.filters}>
          <input
            type="text"
            value={searchText}
            onChange={(event) =>
              setSearchText(
                event.target.value
              )
            }
            placeholder="Search products..."
            style={styles.searchInput}
          />

          <select
            value={selectedCategory}
            onChange={(event) =>
              setSelectedCategory(
                event.target.value
              )
            }
            style={styles.select}
          >
            {categories.map(
              (category) => (
                <option
                  key={category}
                  value={category}
                >
                  {category === "all"
                    ? "All Categories"
                    : category}
                </option>
              )
            )}
          </select>
        </div>

        {filteredProducts.length ===
        0 ? (
          <div style={styles.emptyBox}>
            <div
              style={styles.emptyIcon}
            >
              🔍
            </div>

            <h2
              style={{
                color: "#ff4d4f",
              }}
            >
              No products found
            </h2>

            <p
              style={{
                color: "#6b7280",
              }}
            >
              Search ya category filter
              change karo.
            </p>
          </div>
        ) : (
          <div style={styles.grid}>
            {filteredProducts.map(
              (product) => {
                const productId =
                  getProductId(product);

                const productImage =
                  getProductImage(
                    product
                  );

                const finalPrice =
                  calculatePrice(
                    product
                  );

                const inWishlist =
                  isInWishlist(
                    productId
                  );

                const stock =
                  Number(
                    product.stock
                  ) || 0;

                const localReviews =
                  getLocalReviewData(
                    productId
                  );

                const backendRating =
                  Number(
                    product.rating
                  ) || 0;

                const displayedRating =
                  localReviews.reviewCount >
                  0
                    ? localReviews.averageRating
                    : backendRating;

                return (
                  <article
                    key={productId}
                    style={styles.card}
                    onClick={() =>
                      openProduct(
                        productId
                      )
                    }
                  >
                    <div
                      style={
                        styles.imageWrapper
                      }
                    >
                      <img
                        src={
                          productImage
                        }
                        alt={
                          product.name ||
                          product.title ||
                          "Product"
                        }
                        style={
                          styles.image
                        }
                        onError={(
                          event
                        ) => {
                          event.currentTarget.src =
                            "https://placehold.co/600x400?text=ChillBite";
                        }}
                      />

                      {Number(
                        product.discountPercentage
                      ) > 0 && (
                        <span
                          style={
                            styles.discountBadge
                          }
                        >
                          {
                            product.discountPercentage
                          }
                          % OFF
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={(
                          event
                        ) =>
                          handleWishlist(
                            event,
                            product
                          )
                        }
                        title="Wishlist"
                        style={{
                          ...styles.wishlistButton,

                          background:
                            inWishlist
                              ? "#ff4d4f"
                              : "#ffffff",

                          color:
                            inWishlist
                              ? "#ffffff"
                              : "#ff4d4f",
                        }}
                      >
                        {inWishlist
                          ? "♥"
                          : "♡"}
                      </button>
                    </div>

                    <div
                      style={
                        styles.cardContent
                      }
                    >
                      <div
                        style={
                          styles.metaRow
                        }
                      >
                        <span
                          style={
                            styles.category
                          }
                        >
                          {product.category ||
                            "Dessert"}
                        </span>

                        <span
                          style={
                            styles.rating
                          }
                        >
                          ⭐{" "}
                          {displayedRating.toFixed(
                            1
                          )}

                          {localReviews.reviewCount >
                            0 && (
                            <small
                              style={
                                styles.reviewCount
                              }
                            >
                              {" "}
                              (
                              {
                                localReviews.reviewCount
                              }
                              )
                            </small>
                          )}
                        </span>
                      </div>

                      <h2
                        style={
                          styles.productName
                        }
                      >
                        {product.name ||
                          product.title}
                      </h2>

                      <p
                        style={
                          styles.brand
                        }
                      >
                        {product.brand ||
                          "ChillBite"}
                      </p>

                      <p
                        style={
                          styles.description
                        }
                      >
                        {product.description ||
                          "Fresh and delicious ChillBite product."}
                      </p>

                      <div
                        style={
                          styles.priceRow
                        }
                      >
                        <div>
                          <span
                            style={
                              styles.price
                            }
                          >
                            ₹
                            {Math.round(
                              finalPrice
                            )}
                          </span>

                          {Number(
                            product.discountPercentage
                          ) > 0 && (
                            <span
                              style={
                                styles.oldPrice
                              }
                            >
                              ₹
                              {
                                product.price
                              }
                            </span>
                          )}
                        </div>

                        <span
                          style={
                            styles.unit
                          }
                        >
                          {product.unit ||
                            ""}
                        </span>
                      </div>

                      <p
                        style={{
                          ...styles.stock,

                          color:
                            stock > 0
                              ? "#16a34a"
                              : "#dc2626",
                        }}
                      >
                        {stock > 0
                          ? `${stock} items available`
                          : "Out of stock"}
                      </p>

                      <button
                        type="button"
                        onClick={(
                          event
                        ) => {
                          event.stopPropagation();

                          openProduct(
                            productId
                          );
                        }}
                        style={
                          styles.detailsButton
                        }
                      >
                        View Details & Rate
                      </button>

                      <button
                        type="button"
                        disabled={
                          stock <= 0
                        }
                        onClick={(
                          event
                        ) =>
                          handleAddToCart(
                            event,
                            product
                          )
                        }
                        style={{
                          ...styles.cartButton,

                          opacity:
                            stock <= 0
                              ? 0.5
                              : 1,

                          cursor:
                            stock <= 0
                              ? "not-allowed"
                              : "pointer",
                        }}
                      >
                        {stock > 0
                          ? "Add to Cart"
                          : "Unavailable"}
                      </button>
                    </div>
                  </article>
                );
              }
            )}
          </div>
        )}
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#fffaf8",
    fontFamily:
      "Arial, sans-serif",
  },

  hero: {
    padding: "70px 20px 50px",
    textAlign: "center",
    background:
      "linear-gradient(135deg, #fff5f2, #ffe6de, #fffaf8)",
  },

  heroLabel: {
    margin: "0 0 10px",
    color: "#ff4d4f",
    fontSize: "13px",
    fontWeight: "800",
    letterSpacing: "2px",
  },

  heroTitle: {
    margin: "0 0 14px",
    color: "#1f2937",
    fontSize:
      "clamp(38px, 6vw, 58px)",
  },

  heroDescription: {
    maxWidth: "700px",
    margin: "0 auto",
    color: "#6b7280",
    fontSize: "18px",
    lineHeight: "1.7",
  },

  content: {
    maxWidth: "1250px",
    margin: "0 auto",
    padding: "50px 20px 80px",
  },

  filters: {
    display: "flex",
    gap: "15px",
    marginBottom: "35px",
    flexWrap: "wrap",
  },

  searchInput: {
    flex: "1 1 300px",
    padding: "14px 16px",
    border:
      "1px solid #e5e7eb",
    borderRadius: "11px",
    fontSize: "16px",
    outline: "none",
  },

  select: {
    flex: "0 1 230px",
    padding: "14px 16px",
    border:
      "1px solid #e5e7eb",
    borderRadius: "11px",
    fontSize: "15px",
    background: "#ffffff",
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
    border:
      "1px solid #f0f0f0",
    boxShadow:
      "0 12px 35px rgba(31, 41, 55, 0.08)",
    cursor: "pointer",
    transition:
      "transform 0.2s ease, box-shadow 0.2s ease",
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
    display: "block",
  },

  discountBadge: {
    position: "absolute",
    top: "14px",
    left: "14px",
    padding: "7px 10px",
    background: "#ff4d4f",
    color: "#ffffff",
    borderRadius: "8px",
    fontWeight: "800",
    fontSize: "12px",
  },

  wishlistButton: {
    position: "absolute",
    top: "13px",
    right: "13px",
    width: "42px",
    height: "42px",
    border: "none",
    borderRadius: "50%",
    fontSize: "25px",
    cursor: "pointer",
    boxShadow:
      "0 6px 18px rgba(0, 0, 0, 0.15)",
  },

  cardContent: {
    padding: "21px",
  },

  metaRow: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    gap: "10px",
    marginBottom: "12px",
  },

  category: {
    color: "#ff4d4f",
    fontSize: "13px",
    fontWeight: "800",
    textTransform:
      "capitalize",
  },

  rating: {
    color: "#4b5563",
    fontSize: "14px",
    fontWeight: "700",
  },

  reviewCount: {
    color: "#9ca3af",
    fontSize: "11px",
  },

  productName: {
    margin: "0 0 6px",
    color: "#1f2937",
    fontSize: "22px",
  },

  brand: {
    margin: "0 0 10px",
    color: "#ff4d4f",
    fontSize: "13px",
    fontWeight: "700",
  },

  description: {
    minHeight: "44px",
    margin: "0 0 18px",
    color: "#6b7280",
    lineHeight: "1.55",
    fontSize: "14px",
  },

  priceRow: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    gap: "12px",
    marginBottom: "11px",
  },

  price: {
    color: "#111827",
    fontSize: "24px",
    fontWeight: "900",
  },

  oldPrice: {
    marginLeft: "8px",
    color: "#9ca3af",
    textDecoration:
      "line-through",
  },

  unit: {
    color: "#6b7280",
    fontSize: "13px",
  },

  stock: {
    margin: "0 0 17px",
    fontSize: "13px",
    fontWeight: "700",
  },

  detailsButton: {
    width: "100%",
    marginBottom: "10px",
    padding: "12px",
    border:
      "2px solid #ff4d4f",
    borderRadius: "11px",
    background: "#ffffff",
    color: "#ff4d4f",
    fontSize: "14px",
    fontWeight: "900",
    cursor: "pointer",
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

  emptyBox: {
    padding: "60px 25px",
    background: "#ffffff",
    borderRadius: "20px",
    textAlign: "center",
    boxShadow:
      "0 12px 35px rgba(0, 0, 0, 0.08)",
  },

  emptyIcon: {
    fontSize: "50px",
  },

  statusPage: {
    minHeight: "70vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "30px",
    textAlign: "center",
    background: "#fff8f5",
    fontFamily:
      "Arial, sans-serif",
  },

  statusCard: {
    width: "100%",
    maxWidth: "520px",
    padding: "42px",
    borderRadius: "20px",
    background: "#ffffff",
    boxShadow:
      "0 14px 38px rgba(0,0,0,0.07)",
  },

  statusIcon: {
    fontSize: "55px",
  },
};

export default ProductsPage;