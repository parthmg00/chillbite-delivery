import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import axiosInstance from "../api/axiosInstance.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";

function CheckoutPage() {
  const navigate = useNavigate();

  const { user } = useAuth();
  const { cartItems, cartTotal, clearCart } = useCart();

  const [formData, setFormData] = useState({
    fullName: user?.name || "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    paymentMethod: "Cash on Delivery",
  });

  const [error, setError] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);

  const itemsPrice = useMemo(() => {
    if (typeof cartTotal === "number") {
      return cartTotal;
    }

    return cartItems.reduce((total, item) => {
      const price = Number(item.price) || 0;
      const quantity = Number(item.quantity) || 1;

      return total + price * quantity;
    }, 0);
  }, [cartItems, cartTotal]);

  const deliveryCharge = itemsPrice >= 499 ? 0 : 40;
  const totalPrice = itemsPrice + deliveryCharge;

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      return "Full name enter karo.";
    }

    if (!/^[0-9]{10}$/.test(formData.phone.trim())) {
      return "Valid 10-digit mobile number enter karo.";
    }

    if (!formData.address.trim()) {
      return "Delivery address enter karo.";
    }

    if (!formData.city.trim()) {
      return "City enter karo.";
    }

    if (!formData.state.trim()) {
      return "State enter karo.";
    }

    if (!/^[0-9]{6}$/.test(formData.pincode.trim())) {
      return "Valid 6-digit pincode enter karo.";
    }

    return "";
  };

  const handlePlaceOrder = async (event) => {
    event.preventDefault();

    setError("");

    if (!cartItems || cartItems.length === 0) {
      setError("Cart empty hai.");
      return;
    }

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setPlacingOrder(true);

      const orderItems = cartItems.map((item) => ({
        product: item._id || item.id || item.product,
        name: item.name || item.title || "Product",
        image:
          item.image ||
          item.images?.[0]?.url ||
          item.images?.[0] ||
          "",
        quantity: Number(item.quantity) || 1,
        price: Number(item.price) || 0,
      }));

      const orderData = {
        items: orderItems,

        shippingAddress: {
          fullName: formData.fullName.trim(),
          phone: formData.phone.trim(),
          address: formData.address.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          pincode: formData.pincode.trim(),
        },

        paymentMethod: formData.paymentMethod,
        itemsPrice,
        deliveryCharge,
        totalPrice,
      };

      const response = await axiosInstance.post("/orders", orderData);

      const createdOrder =
        response.data?.order ||
        response.data?.data?.order ||
        response.data?.data;

      const orderId = createdOrder?._id;

      if (!orderId) {
        throw new Error("Order ID response me nahi mila.");
      }

      clearCart();

      navigate(`/order-success/${orderId}`, {
        replace: true,
        state: {
          order: createdOrder,
        },
      });
    } catch (requestError) {
      console.error("Place order error:", requestError);

      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Order place nahi hua. Please try again."
      );
    } finally {
      setPlacingOrder(false);
    }
  };

  if (!cartItems || cartItems.length === 0) {
    return (
      <main style={styles.emptyPage}>
        <section style={styles.emptyCard}>
          <h1 style={styles.emptyTitle}>Your cart is empty</h1>

          <p style={styles.mutedText}>
            Checkout karne ke liye pehle products cart me add karo.
          </p>

          <button
            type="button"
            onClick={() => navigate("/products")}
            style={styles.primaryButton}
          >
            Browse Products
          </button>
        </section>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <div style={styles.headingBox}>
          <p style={styles.eyebrow}>SECURE CHECKOUT</p>
          <h1 style={styles.pageTitle}>Complete Your Order</h1>
          <p style={styles.mutedText}>
            Delivery details verify karke order place karo.
          </p>
        </div>

        <div style={styles.checkoutGrid}>
          <form onSubmit={handlePlaceOrder} style={styles.formCard}>
            <h2 style={styles.sectionTitle}>Delivery Address</h2>

            {error && <div style={styles.errorBox}>{error}</div>}

            <div style={styles.formGrid}>
              <label style={styles.label}>
                Full Name
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  style={styles.input}
                />
              </label>

              <label style={styles.label}>
                Mobile Number
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  style={styles.input}
                />
              </label>
            </div>

            <label style={styles.label}>
              House / Flat / Street Address
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="House number, building, street, landmark"
                rows={4}
                style={styles.textarea}
              />
            </label>

            <div style={styles.formGrid}>
              <label style={styles.label}>
                City
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="City"
                  style={styles.input}
                />
              </label>

              <label style={styles.label}>
                State
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="State"
                  style={styles.input}
                />
              </label>
            </div>

            <label style={styles.label}>
              Pincode
              <input
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                placeholder="6-digit pincode"
                maxLength={6}
                style={styles.input}
              />
            </label>

            <h2 style={styles.paymentTitle}>Payment Method</h2>

            <label style={styles.paymentOption}>
              <input
                type="radio"
                name="paymentMethod"
                value="Cash on Delivery"
                checked={formData.paymentMethod === "Cash on Delivery"}
                onChange={handleChange}
              />

              <span>
                <strong>Cash on Delivery</strong>
                <small style={styles.paymentDescription}>
                  Order receive karte waqt payment karo.
                </small>
              </span>
            </label>

            <label style={styles.paymentOption}>
              <input
                type="radio"
                name="paymentMethod"
                value="UPI"
                checked={formData.paymentMethod === "UPI"}
                onChange={handleChange}
              />

              <span>
                <strong>UPI — Demo</strong>
                <small style={styles.paymentDescription}>
                  Demo project ke liye payment success maana jayega.
                </small>
              </span>
            </label>

            <button
              type="submit"
              disabled={placingOrder}
              style={{
                ...styles.placeOrderButton,
                opacity: placingOrder ? 0.7 : 1,
                cursor: placingOrder ? "not-allowed" : "pointer",
              }}
            >
              {placingOrder
                ? "Placing Order..."
                : `Place Order • ₹${totalPrice.toFixed(2)}`}
            </button>
          </form>

          <aside style={styles.summaryCard}>
            <h2 style={styles.sectionTitle}>Order Summary</h2>

            <div style={styles.productList}>
              {cartItems.map((item) => {
                const productId =
                  item._id || item.id || item.product;

                const image =
                  item.image ||
                  item.images?.[0]?.url ||
                  item.images?.[0] ||
                  "https://placehold.co/100x100?text=Product";

                const itemPrice = Number(item.price) || 0;
                const quantity = Number(item.quantity) || 1;

                return (
                  <article
                    key={productId}
                    style={styles.productRow}
                  >
                    <img
                      src={image}
                      alt={item.name || "Product"}
                      style={styles.productImage}
                    />

                    <div style={styles.productInfo}>
                      <h3 style={styles.productName}>
                        {item.name || item.title}
                      </h3>

                      <p style={styles.productQuantity}>
                        Quantity: {quantity}
                      </p>
                    </div>

                    <strong style={styles.productPrice}>
                      ₹{(itemPrice * quantity).toFixed(2)}
                    </strong>
                  </article>
                );
              })}
            </div>

            <div style={styles.priceSection}>
              <div style={styles.priceRow}>
                <span>Items Total</span>
                <span>₹{itemsPrice.toFixed(2)}</span>
              </div>

              <div style={styles.priceRow}>
                <span>Delivery Charge</span>

                <span>
                  {deliveryCharge === 0
                    ? "FREE"
                    : `₹${deliveryCharge.toFixed(2)}`}
                </span>
              </div>

              <div style={styles.totalRow}>
                <span>Grand Total</span>
                <span>₹{totalPrice.toFixed(2)}</span>
              </div>
            </div>

            {deliveryCharge === 0 ? (
              <p style={styles.freeDeliveryText}>
                🎉 Free delivery applied
              </p>
            ) : (
              <p style={styles.deliveryHint}>
                ₹{(499 - itemsPrice).toFixed(2)} aur add karo aur free
                delivery pao.
              </p>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "45px 20px 70px",
    background: "#fff8f5",
    fontFamily: "Arial, sans-serif",
  },

  container: {
    width: "100%",
    maxWidth: "1180px",
    margin: "0 auto",
  },

  headingBox: {
    marginBottom: "30px",
  },

  eyebrow: {
    margin: "0 0 8px",
    color: "#ff4d4f",
    fontSize: "13px",
    fontWeight: "900",
    letterSpacing: "1.4px",
  },

  pageTitle: {
    margin: "0 0 10px",
    color: "#1f2937",
    fontSize: "38px",
  },

  mutedText: {
    color: "#6b7280",
    lineHeight: "1.6",
  },

  checkoutGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.4fr) minmax(320px, 0.8fr)",
    gap: "28px",
    alignItems: "start",
  },

  formCard: {
    padding: "30px",
    background: "#ffffff",
    borderRadius: "20px",
    boxShadow: "0 15px 40px rgba(0, 0, 0, 0.07)",
  },

  summaryCard: {
    position: "sticky",
    top: "105px",
    padding: "28px",
    background: "#ffffff",
    borderRadius: "20px",
    boxShadow: "0 15px 40px rgba(0, 0, 0, 0.07)",
  },

  sectionTitle: {
    margin: "0 0 24px",
    color: "#1f2937",
    fontSize: "23px",
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "18px",
  },

  label: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginBottom: "18px",
    color: "#374151",
    fontSize: "14px",
    fontWeight: "800",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "14px",
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    outline: "none",
    fontSize: "15px",
  },

  textarea: {
    width: "100%",
    boxSizing: "border-box",
    padding: "14px",
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    outline: "none",
    resize: "vertical",
    fontFamily: "inherit",
    fontSize: "15px",
  },

  errorBox: {
    marginBottom: "20px",
    padding: "13px 15px",
    border: "1px solid #fecaca",
    borderRadius: "10px",
    background: "#fef2f2",
    color: "#dc2626",
  },

  paymentTitle: {
    margin: "12px 0 16px",
    color: "#1f2937",
    fontSize: "21px",
  },

  paymentOption: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    marginBottom: "14px",
    padding: "16px",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    cursor: "pointer",
  },

  paymentDescription: {
    display: "block",
    marginTop: "5px",
    color: "#6b7280",
    fontWeight: "400",
    lineHeight: "1.4",
  },

  placeOrderButton: {
    width: "100%",
    marginTop: "18px",
    padding: "15px",
    border: "none",
    borderRadius: "11px",
    background: "#ff4d4f",
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: "900",
  },

  productList: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },

  productRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    paddingBottom: "15px",
    borderBottom: "1px solid #eeeeee",
  },

  productImage: {
    width: "60px",
    height: "60px",
    borderRadius: "10px",
    objectFit: "cover",
    background: "#f3f4f6",
  },

  productInfo: {
    flex: 1,
  },

  productName: {
    margin: "0 0 5px",
    color: "#1f2937",
    fontSize: "15px",
  },

  productQuantity: {
    margin: 0,
    color: "#6b7280",
    fontSize: "13px",
  },

  productPrice: {
    color: "#111827",
    fontSize: "14px",
  },

  priceSection: {
    marginTop: "22px",
  },

  priceRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "13px",
    color: "#4b5563",
  },

  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "15px",
    paddingTop: "17px",
    borderTop: "2px solid #eeeeee",
    color: "#111827",
    fontSize: "19px",
    fontWeight: "900",
  },

  freeDeliveryText: {
    margin: "18px 0 0",
    padding: "11px",
    borderRadius: "10px",
    background: "#ecfdf5",
    color: "#047857",
    textAlign: "center",
    fontWeight: "700",
  },

  deliveryHint: {
    margin: "18px 0 0",
    color: "#6b7280",
    textAlign: "center",
    fontSize: "13px",
    lineHeight: "1.5",
  },

  emptyPage: {
    minHeight: "75vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "30px",
    background: "#fff8f5",
    fontFamily: "Arial, sans-serif",
  },

  emptyCard: {
    width: "100%",
    maxWidth: "520px",
    padding: "45px",
    borderRadius: "20px",
    background: "#ffffff",
    boxShadow: "0 15px 40px rgba(0,0,0,0.07)",
    textAlign: "center",
  },

  emptyTitle: {
    marginTop: 0,
    color: "#1f2937",
  },

  primaryButton: {
    marginTop: "15px",
    padding: "13px 20px",
    border: "none",
    borderRadius: "10px",
    background: "#ff4d4f",
    color: "#ffffff",
    fontWeight: "800",
    cursor: "pointer",
  },
};

export default CheckoutPage;