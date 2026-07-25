import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import axiosInstance from "../api/axiosInstance.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";

function CheckoutPage() {
  const navigate = useNavigate();

  const { user, updateUser } = useAuth();
  const { cartItems, cartTotal, clearCart } = useCart();

  const [formData, setFormData] = useState({
    fullName: user?.name || "",
    phone: user?.phone || "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    paymentMethod: "Cash on Delivery",
  });

  const [error, setError] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);

  const walletBalance = Number(user?.walletBalance || 0);

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

  const isWalletSelected = formData.paymentMethod === "Wallet";
  const hasEnoughWalletBalance = walletBalance >= totalPrice;

  const formatMoney = (amount) =>
    Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));

    setError("");
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

    if (isWalletSelected && !hasEnoughWalletBalance) {
      return `Wallet balance insufficient hai. Available balance ₹${formatMoney(
        walletBalance
      )} hai.`;
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

      const orderItems = cartItems.map((item) => {
        const productId =
          item._id ||
          item.id ||
          item.product?._id ||
          item.product;

        return {
          product: productId,
          name: item.name || item.title || "Product",
          image:
            item.image ||
            item.images?.[0]?.url ||
            (typeof item.images?.[0] === "string"
              ? item.images[0]
              : ""),
          quantity: Number(item.quantity) || 1,
          price: Number(item.finalPrice ?? item.price) || 0,
        };
      });

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
        deliveryCharge,
        discountAmount: 0,
      };

      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("accessToken");

      if (!token) {
        throw new Error(
          "Login session nahi mila. Please logout karke dobara login karo."
        );
      }

      const response = await axiosInstance.post(
        "/orders",
        orderData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const responseData = response.data;

      const createdOrder =
        responseData?.order ||
        responseData?.data?.order ||
        responseData?.data;

      const orderId = createdOrder?._id;

      if (!orderId) {
        throw new Error("Order ID response me nahi mila.");
      }

      if (formData.paymentMethod === "Wallet") {
        const updatedWalletBalance = Number(
          responseData?.walletBalance ??
            responseData?.data?.walletBalance ??
            walletBalance - totalPrice
        );

        if (typeof updateUser === "function") {
          updateUser({
            walletBalance: updatedWalletBalance,
          });
        }
      }

      clearCart();

      navigate(`/order-success/${orderId}`, {
        replace: true,
        state: {
          order: createdOrder,
          paymentMethod: formData.paymentMethod,
          walletBalance:
            responseData?.walletBalance ??
            responseData?.data?.walletBalance,
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
          <div style={styles.emptyIcon}>🛒</div>

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
            Delivery details verify karke payment method select karo.
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

            <div style={styles.paymentHeadingRow}>
              <h2 style={styles.paymentTitle}>Payment Method</h2>

              <button
                type="button"
                onClick={() => navigate("/wallet")}
                style={styles.manageWalletButton}
              >
                Manage Wallet
              </button>
            </div>

            <label
              style={{
                ...styles.paymentOption,
                ...(formData.paymentMethod === "Wallet"
                  ? styles.selectedPaymentOption
                  : {}),
                ...(!hasEnoughWalletBalance
                  ? styles.disabledPaymentOption
                  : {}),
              }}
            >
              <input
                type="radio"
                name="paymentMethod"
                value="Wallet"
                checked={formData.paymentMethod === "Wallet"}
                onChange={handleChange}
                disabled={!hasEnoughWalletBalance}
              />

              <span style={styles.paymentIcon}>₹</span>

              <span style={styles.paymentContent}>
                <span style={styles.paymentNameRow}>
                  <strong>ChillBite Wallet</strong>

                  <strong
                    style={{
                      ...styles.walletBalanceText,
                      color: hasEnoughWalletBalance
                        ? "#047857"
                        : "#dc2626",
                    }}
                  >
                    ₹{formatMoney(walletBalance)}
                  </strong>
                </span>

                <small style={styles.paymentDescription}>
                  {hasEnoughWalletBalance
                    ? `₹${formatMoney(
                        totalPrice
                      )} wallet se instantly deduct hoga.`
                    : `₹${formatMoney(
                        totalPrice - walletBalance
                      )} aur add karna hoga.`}
                </small>
              </span>
            </label>

            {!hasEnoughWalletBalance && (
              <div style={styles.walletWarning}>
                <span>
                  Wallet balance insufficient hai. Wallet me money add karo.
                </span>

                <button
                  type="button"
                  onClick={() => navigate("/wallet")}
                  style={styles.addWalletMoneyButton}
                >
                  Add Money
                </button>
              </div>
            )}

            <label
              style={{
                ...styles.paymentOption,
                ...(formData.paymentMethod === "Cash on Delivery"
                  ? styles.selectedPaymentOption
                  : {}),
              }}
            >
              <input
                type="radio"
                name="paymentMethod"
                value="Cash on Delivery"
                checked={
                  formData.paymentMethod === "Cash on Delivery"
                }
                onChange={handleChange}
              />

              <span style={styles.paymentIcon}>💵</span>

              <span style={styles.paymentContent}>
                <strong>Cash on Delivery</strong>

                <small style={styles.paymentDescription}>
                  Order receive karte waqt payment karo.
                </small>
              </span>
            </label>

            <label
              style={{
                ...styles.paymentOption,
                ...(formData.paymentMethod === "UPI"
                  ? styles.selectedPaymentOption
                  : {}),
              }}
            >
              <input
                type="radio"
                name="paymentMethod"
                value="UPI"
                checked={formData.paymentMethod === "UPI"}
                onChange={handleChange}
              />

              <span style={styles.paymentIcon}>📱</span>

              <span style={styles.paymentContent}>
                <strong>UPI — Demo</strong>

                <small style={styles.paymentDescription}>
                  Demo project ke liye payment successful maana jayega.
                </small>
              </span>
            </label>

            <button
              type="submit"
              disabled={
                placingOrder ||
                (isWalletSelected && !hasEnoughWalletBalance)
              }
              style={{
                ...styles.placeOrderButton,
                opacity:
                  placingOrder ||
                  (isWalletSelected && !hasEnoughWalletBalance)
                    ? 0.65
                    : 1,
                cursor:
                  placingOrder ||
                  (isWalletSelected && !hasEnoughWalletBalance)
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {placingOrder
                ? "Placing Order..."
                : isWalletSelected
                  ? `Pay ₹${formatMoney(totalPrice)} with Wallet`
                  : `Place Order • ₹${formatMoney(totalPrice)}`}
            </button>

            <p style={styles.secureCheckoutText}>
              🔒 Your order and payment information is secure.
            </p>
          </form>

          <aside style={styles.summaryCard}>
            <h2 style={styles.sectionTitle}>Order Summary</h2>

            <div style={styles.productList}>
              {cartItems.map((item, index) => {
                const productId =
                  item._id ||
                  item.id ||
                  item.product ||
                  `cart-item-${index}`;

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
                      alt={item.name || item.title || "Product"}
                      style={styles.productImage}
                    />

                    <div style={styles.productInfo}>
                      <h3 style={styles.productName}>
                        {item.name || item.title || "Product"}
                      </h3>

                      <p style={styles.productQuantity}>
                        Quantity: {quantity}
                      </p>
                    </div>

                    <strong style={styles.productPrice}>
                      ₹{formatMoney(itemPrice * quantity)}
                    </strong>
                  </article>
                );
              })}
            </div>

            <div style={styles.priceSection}>
              <div style={styles.priceRow}>
                <span>Items Total</span>
                <span>₹{formatMoney(itemsPrice)}</span>
              </div>

              <div style={styles.priceRow}>
                <span>Delivery Charge</span>

                <span>
                  {deliveryCharge === 0
                    ? "FREE"
                    : `₹${formatMoney(deliveryCharge)}`}
                </span>
              </div>

              <div style={styles.totalRow}>
                <span>Grand Total</span>
                <span>₹{formatMoney(totalPrice)}</span>
              </div>
            </div>

            {isWalletSelected && (
              <div style={styles.walletSummary}>
                <div style={styles.walletSummaryRow}>
                  <span>Wallet Balance</span>
                  <strong>₹{formatMoney(walletBalance)}</strong>
                </div>

                <div style={styles.walletSummaryRow}>
                  <span>Order Deduction</span>
                  <strong>- ₹{formatMoney(totalPrice)}</strong>
                </div>

                <div style={styles.walletRemainingRow}>
                  <span>Remaining Balance</span>

                  <strong>
                    ₹
                    {formatMoney(
                      Math.max(walletBalance - totalPrice, 0)
                    )}
                  </strong>
                </div>
              </div>
            )}

            {deliveryCharge === 0 ? (
              <p style={styles.freeDeliveryText}>
                🎉 Free delivery applied
              </p>
            ) : (
              <p style={styles.deliveryHint}>
                ₹{formatMoney(Math.max(499 - itemsPrice, 0))} aur add
                karo aur free delivery pao.
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
    margin: 0,
    color: "#6b7280",
    lineHeight: "1.6",
  },

  checkoutGrid: {
    display: "grid",
    gridTemplateColumns:
      "minmax(0, 1.4fr) minmax(320px, 0.8fr)",
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
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
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
    fontWeight: "700",
  },

  paymentHeadingRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    margin: "12px 0 16px",
  },

  paymentTitle: {
    margin: 0,
    color: "#1f2937",
    fontSize: "21px",
  },

  manageWalletButton: {
    border: "none",
    background: "transparent",
    color: "#ff4d4f",
    fontSize: "13px",
    fontWeight: "800",
    cursor: "pointer",
  },

  paymentOption: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    marginBottom: "14px",
    padding: "16px",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    background: "#ffffff",
    cursor: "pointer",
  },

  selectedPaymentOption: {
    borderColor: "#ff4d4f",
    background: "#fff8f5",
    boxShadow: "0 5px 15px rgba(255, 77, 79, 0.08)",
  },

  disabledPaymentOption: {
    opacity: 0.65,
    cursor: "not-allowed",
  },

  paymentIcon: {
    width: "38px",
    height: "38px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "10px",
    background: "#fff1f2",
    color: "#ff4d4f",
    fontSize: "18px",
    fontWeight: "900",
  },

  paymentContent: {
    flex: 1,
    minWidth: 0,
  },

  paymentNameRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
  },

  walletBalanceText: {
    whiteSpace: "nowrap",
  },

  paymentDescription: {
    display: "block",
    marginTop: "5px",
    color: "#6b7280",
    fontWeight: "400",
    lineHeight: "1.4",
  },

  walletWarning: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    margin: "-4px 0 14px",
    padding: "12px 14px",
    border: "1px solid #fed7aa",
    borderRadius: "10px",
    background: "#fff7ed",
    color: "#c2410c",
    fontSize: "13px",
    fontWeight: "700",
  },

  addWalletMoneyButton: {
    flexShrink: 0,
    padding: "8px 11px",
    border: "none",
    borderRadius: "8px",
    background: "#ff4d4f",
    color: "#ffffff",
    fontWeight: "800",
    cursor: "pointer",
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

  secureCheckoutText: {
    margin: "13px 0 0",
    color: "#6b7280",
    fontSize: "12px",
    textAlign: "center",
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

  walletSummary: {
    marginTop: "20px",
    padding: "15px",
    border: "1px solid #a7f3d0",
    borderRadius: "12px",
    background: "#ecfdf5",
  },

  walletSummaryRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "10px",
    color: "#047857",
    fontSize: "13px",
  },

  walletRemainingRow: {
    display: "flex",
    justifyContent: "space-between",
    paddingTop: "11px",
    borderTop: "1px solid #a7f3d0",
    color: "#065f46",
    fontSize: "14px",
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

  emptyIcon: {
    width: "65px",
    height: "65px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 15px",
    borderRadius: "20px",
    background: "#fff1f2",
    fontSize: "28px",
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
