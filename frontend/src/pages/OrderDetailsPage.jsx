import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import axiosInstance from "../api/axiosInstance.js";
import { useAuth } from "../context/AuthContext.jsx";

const cancellableStatuses = [
  "Pending",
  "Confirmed",
  "Preparing",
];

const trackingSteps = [
  "Pending",
  "Confirmed",
  "Preparing",
  "Out for Delivery",
  "Delivered",
];

function OrderDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { updateUser } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axiosInstance.get(
        `/orders/${id}`
      );

      const receivedOrder =
        response.data?.order ||
        response.data?.data?.order ||
        response.data;

      if (!receivedOrder?._id) {
        throw new Error("Order details not found.");
      }

      setOrder(receivedOrder);
    } catch (requestError) {
      console.error(
        "Order details fetch error:",
        requestError
      );

      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Order details load nahi hue."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleCancelOrder = async () => {
    const reason = window.prompt(
      "Order cancel karne ka reason enter karo:"
    );

    if (!reason || !reason.trim()) {
      return;
    }

    const confirmed = window.confirm(
      "Kya tum sure ho ki ye order cancel karna hai?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setCancelling(true);

      const response = await axiosInstance.put(
        `/orders/${id}/cancel`,
        {
          reason: reason.trim(),
        }
      );

      const updatedOrder =
        response.data?.order ||
        response.data?.data?.order;

      if (updatedOrder) {
        setOrder(updatedOrder);
      } else {
        await fetchOrder();
      }

      const walletBalance = Number(
        response.data?.walletBalance
      );

      if (
        Number.isFinite(walletBalance) &&
        typeof updateUser === "function"
      ) {
        updateUser({
          walletBalance,
        });
      }

      const refundedAmount = Number(
        response.data?.refundedAmount || 0
      );

      if (refundedAmount > 0) {
        window.alert(
          `Order cancel ho gaya. ₹${refundedAmount.toFixed(
            2
          )} wallet me refund ho gaya.`
        );
      } else {
        window.alert(
          response.data?.message ||
            "Order successfully cancel ho gaya."
        );
      }
    } catch (requestError) {
      console.error(
        "Cancel order error:",
        requestError
      );

      window.alert(
        requestError.response?.data?.message ||
          "Order cancel nahi ho saka."
      );
    } finally {
      setCancelling(false);
    }
  };

  const getStatusStyle = (status) => {
    const normalizedStatus = String(
      status || ""
    ).toLowerCase();

    if (normalizedStatus === "delivered") {
      return {
        background: "#dcfce7",
        color: "#15803d",
      };
    }

    if (normalizedStatus === "cancelled") {
      return {
        background: "#fee2e2",
        color: "#dc2626",
      };
    }

    if (
      normalizedStatus === "confirmed" ||
      normalizedStatus === "out for delivery"
    ) {
      return {
        background: "#dbeafe",
        color: "#1d4ed8",
      };
    }

    if (normalizedStatus === "preparing") {
      return {
        background: "#f3e8ff",
        color: "#7e22ce",
      };
    }

    return {
      background: "#fef3c7",
      color: "#b45309",
    };
  };

  const getPaymentStatusStyle = (status) => {
    const normalizedStatus = String(
      status || ""
    ).toLowerCase();

    if (normalizedStatus === "paid") {
      return {
        color: "#15803d",
      };
    }

    if (normalizedStatus === "refunded") {
      return {
        color: "#7c3aed",
      };
    }

    if (normalizedStatus === "failed") {
      return {
        color: "#dc2626",
      };
    }

    return {
      color: "#b45309",
    };
  };

  const getTrackingStepIndex = (status) => {
    return trackingSteps.findIndex(
      (step) =>
        step.toLowerCase() ===
        String(status || "").toLowerCase()
    );
  };

  if (loading) {
    return (
      <main style={styles.centerPage}>
        <section style={styles.messageCard}>
          <div style={styles.loadingIcon}>📦</div>

          <h2 style={styles.loadingTitle}>
            Loading order details...
          </h2>
        </section>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main style={styles.centerPage}>
        <section style={styles.messageCard}>
          <div style={styles.errorIcon}>⚠️</div>

          <h2 style={styles.errorTitle}>
            Order not found
          </h2>

          <p style={styles.mutedText}>
            {error || "Order details available nahi hain."}
          </p>

          <div style={styles.centerActions}>
            <button
              type="button"
              onClick={fetchOrder}
              style={styles.retryButton}
            >
              Try Again
            </button>

            <Link
              to="/orders"
              style={styles.backLink}
            >
              My Orders
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const statusIndex = getTrackingStepIndex(
    order.orderStatus
  );

  const isCancelled =
    order.orderStatus === "Cancelled";

  const canCancel =
    cancellableStatuses.includes(
      order.orderStatus
    );

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <button
          type="button"
          onClick={() => navigate("/orders")}
          style={styles.backButton}
        >
          ← Back to My Orders
        </button>

        <section style={styles.card}>
          <div style={styles.header}>
            <div>
              <p style={styles.eyebrow}>
                ORDER DETAILS
              </p>

              <h1 style={styles.title}>
                #{order._id}
              </h1>

              <p style={styles.dateText}>
                Placed on{" "}
                {order.createdAt
                  ? new Date(
                      order.createdAt
                    ).toLocaleString()
                  : "Not available"}
              </p>
            </div>

            <span
              style={{
                ...styles.statusBadge,
                ...getStatusStyle(
                  order.orderStatus
                ),
              }}
            >
              {order.orderStatus || "Pending"}
            </span>
          </div>

          {!isCancelled && (
            <section style={styles.trackingBox}>
              <h2 style={styles.sectionTitle}>
                Order Tracking
              </h2>

              <div style={styles.trackingSteps}>
                {trackingSteps.map(
                  (step, index) => {
                    const completed =
                      index <= statusIndex;

                    return (
                      <div
                        key={step}
                        style={styles.trackingItem}
                      >
                        <div
                          style={{
                            ...styles.trackingCircle,
                            ...(completed
                              ? styles.trackingCircleActive
                              : {}),
                          }}
                        >
                          {completed
                            ? "✓"
                            : index + 1}
                        </div>

                        <span
                          style={{
                            ...styles.trackingText,
                            ...(completed
                              ? styles.trackingTextActive
                              : {}),
                          }}
                        >
                          {step}
                        </span>
                      </div>
                    );
                  }
                )}
              </div>
            </section>
          )}

          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>
              Ordered Items
            </h2>

            <div style={styles.itemsList}>
              {order.items?.map(
                (item, index) => (
                  <div
                    key={`${item.product}-${index}`}
                    style={styles.itemRow}
                  >
                    <img
                      src={
                        item.image ||
                        "https://placehold.co/90x90?text=Food"
                      }
                      alt={
                        item.name || "Product"
                      }
                      style={styles.itemImage}
                    />

                    <div style={styles.itemInfo}>
                      <strong style={styles.itemName}>
                        {item.name || "Product"}
                      </strong>

                      <span style={styles.itemMeta}>
                        ₹
                        {Number(
                          item.price || 0
                        ).toFixed(2)}{" "}
                        × {item.quantity || 1}
                      </span>
                    </div>

                    <strong style={styles.itemTotal}>
                      ₹
                      {(
                        Number(
                          item.price || 0
                        ) *
                        Number(
                          item.quantity || 1
                        )
                      ).toFixed(2)}
                    </strong>
                  </div>
                )
              )}
            </div>
          </section>

          <div style={styles.twoColumn}>
            <section style={styles.infoCard}>
              <h2 style={styles.sectionTitle}>
                Delivery Address
              </h2>

              <div style={styles.addressText}>
                <strong>
                  {order.shippingAddress?.fullName}
                </strong>

                <span>
                  {order.shippingAddress?.address}
                </span>

                <span>
                  {order.shippingAddress?.city},{" "}
                  {order.shippingAddress?.state} -{" "}
                  {order.shippingAddress?.pincode}
                </span>

                <span>
                  Phone:{" "}
                  {order.shippingAddress?.phone}
                </span>
              </div>
            </section>

            <section style={styles.infoCard}>
              <h2 style={styles.sectionTitle}>
                Payment Details
              </h2>

              <div style={styles.detailRows}>
                <div style={styles.detailRow}>
                  <span>Payment Method</span>

                  <strong>
                    {order.paymentMethod ||
                      "Cash on Delivery"}
                  </strong>
                </div>

                <div style={styles.detailRow}>
                  <span>Payment Status</span>

                  <strong
                    style={getPaymentStatusStyle(
                      order.paymentStatus
                    )}
                  >
                    {order.paymentStatus ||
                      "Pending"}
                  </strong>
                </div>

                {order.paymentId && (
                  <div style={styles.detailRow}>
                    <span>Payment ID</span>

                    <strong
                      style={{
                        overflowWrap: "anywhere",
                      }}
                    >
                      {order.paymentId}
                    </strong>
                  </div>
                )}
              </div>
            </section>
          </div>

          <section style={styles.summaryCard}>
            <h2 style={styles.sectionTitle}>
              Price Summary
            </h2>

            <div style={styles.detailRows}>
              <div style={styles.detailRow}>
                <span>Items Price</span>

                <strong>
                  ₹
                  {Number(
                    order.itemsPrice || 0
                  ).toFixed(2)}
                </strong>
              </div>

              <div style={styles.detailRow}>
                <span>Delivery Charge</span>

                <strong>
                  ₹
                  {Number(
                    order.deliveryCharge || 0
                  ).toFixed(2)}
                </strong>
              </div>

              <div style={styles.detailRow}>
                <span>Discount</span>

                <strong style={styles.discountText}>
                  -₹
                  {Number(
                    order.discountAmount || 0
                  ).toFixed(2)}
                </strong>
              </div>

              <div style={styles.totalRow}>
                <span>Total Amount</span>

                <strong>
                  ₹
                  {Number(
                    order.totalPrice || 0
                  ).toFixed(2)}
                </strong>
              </div>
            </div>
          </section>

          {isCancelled && (
            <section style={styles.cancelledBox}>
              <h2 style={styles.cancelledTitle}>
                Order Cancelled
              </h2>

              <div style={styles.detailRows}>
                <div style={styles.detailRow}>
                  <span>Reason</span>

                  <strong>
                    {order.cancellation?.reason ||
                      "No reason provided"}
                  </strong>
                </div>

                <div style={styles.detailRow}>
                  <span>Refund Status</span>

                  <strong>
                    {order.refundStatus ||
                      "Not Applicable"}
                  </strong>
                </div>

                {Number(
                  order.refundedAmount || 0
                ) > 0 && (
                  <div style={styles.refundBox}>
                    ₹
                    {Number(
                      order.refundedAmount
                    ).toFixed(2)}{" "}
                    wallet me refund ho gaya.
                  </div>
                )}
              </div>
            </section>
          )}

          <div style={styles.actions}>
            {canCancel && (
              <button
                type="button"
                disabled={cancelling}
                onClick={handleCancelOrder}
                style={{
                  ...styles.cancelButton,
                  ...(cancelling
                    ? styles.disabledButton
                    : {}),
                }}
              >
                {cancelling
                  ? "Cancelling..."
                  : "Cancel Order"}
              </button>
            )}

            <Link
              to="/products"
              style={styles.shopLink}
            >
              Continue Shopping
            </Link>

            <Link
              to="/wallet"
              style={styles.walletLink}
            >
              View Wallet
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "40px 20px 70px",
    background: "#fff8f5",
    fontFamily: "Arial, sans-serif",
  },

  container: {
    width: "100%",
    maxWidth: "1050px",
    margin: "0 auto",
  },

  backButton: {
    marginBottom: "18px",
    padding: 0,
    border: "none",
    background: "transparent",
    color: "#ff4d4f",
    fontSize: "15px",
    fontWeight: "800",
    cursor: "pointer",
  },

  card: {
    padding: "30px",
    borderRadius: "22px",
    background: "#ffffff",
    boxShadow: "0 15px 42px rgba(0, 0, 0, 0.08)",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
    paddingBottom: "22px",
    borderBottom: "1px solid #eeeeee",
  },

  eyebrow: {
    margin: "0 0 7px",
    color: "#ff4d4f",
    fontSize: "12px",
    fontWeight: "900",
    letterSpacing: "1.3px",
  },

  title: {
    margin: "0 0 8px",
    color: "#1f2937",
    fontSize: "25px",
    overflowWrap: "anywhere",
  },

  dateText: {
    margin: 0,
    color: "#6b7280",
    fontSize: "14px",
  },

  statusBadge: {
    padding: "9px 14px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: "900",
    whiteSpace: "nowrap",
  },

  trackingBox: {
    marginTop: "25px",
    padding: "20px",
    borderRadius: "14px",
    background: "#f9fafb",
    overflowX: "auto",
  },

  trackingSteps: {
    display: "flex",
    justifyContent: "space-between",
    minWidth: "650px",
    gap: "10px",
  },

  trackingItem: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    textAlign: "center",
  },

  trackingCircle: {
    width: "34px",
    height: "34px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: "50%",
    background: "#e5e7eb",
    color: "#6b7280",
    fontSize: "13px",
    fontWeight: "900",
  },

  trackingCircleActive: {
    background: "#ff4d4f",
    color: "#ffffff",
  },

  trackingText: {
    color: "#9ca3af",
    fontSize: "11px",
    fontWeight: "700",
  },

  trackingTextActive: {
    color: "#374151",
  },

  section: {
    marginTop: "26px",
  },

  sectionTitle: {
    margin: "0 0 16px",
    color: "#1f2937",
    fontSize: "18px",
  },

  itemsList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  itemRow: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "13px",
    borderRadius: "12px",
    background: "#f9fafb",
  },

  itemImage: {
    width: "70px",
    height: "70px",
    borderRadius: "10px",
    objectFit: "cover",
    background: "#e5e7eb",
  },

  itemInfo: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },

  itemName: {
    color: "#1f2937",
  },

  itemMeta: {
    color: "#6b7280",
    fontSize: "13px",
  },

  itemTotal: {
    color: "#ff4d4f",
  },

  twoColumn: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "18px",
    marginTop: "25px",
  },

  infoCard: {
    padding: "20px",
    borderRadius: "14px",
    background: "#f9fafb",
  },

  addressText: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
    color: "#4b5563",
    lineHeight: "1.5",
  },

  detailRows: {
    display: "flex",
    flexDirection: "column",
    gap: "13px",
  },

  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    color: "#4b5563",
  },

  summaryCard: {
    marginTop: "20px",
    padding: "20px",
    borderRadius: "14px",
    background: "#fff5f2",
  },

  discountText: {
    color: "#15803d",
  },

  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    paddingTop: "14px",
    borderTop: "1px solid #f2d6d1",
    color: "#ff4d4f",
    fontSize: "19px",
  },

  cancelledBox: {
    marginTop: "20px",
    padding: "20px",
    border: "1px solid #fecaca",
    borderRadius: "14px",
    background: "#fef2f2",
  },

  cancelledTitle: {
    margin: "0 0 15px",
    color: "#dc2626",
    fontSize: "18px",
  },

  refundBox: {
    padding: "12px",
    borderRadius: "9px",
    background: "#dcfce7",
    color: "#15803d",
    fontWeight: "800",
  },

  actions: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "25px",
  },

  cancelButton: {
    padding: "12px 17px",
    border: "1px solid #dc2626",
    borderRadius: "9px",
    background: "#ffffff",
    color: "#dc2626",
    fontWeight: "800",
    cursor: "pointer",
  },

  shopLink: {
    padding: "12px 17px",
    borderRadius: "9px",
    background: "#ff4d4f",
    color: "#ffffff",
    textDecoration: "none",
    fontWeight: "800",
  },

  walletLink: {
    padding: "12px 17px",
    border: "1px solid #ff4d4f",
    borderRadius: "9px",
    color: "#ff4d4f",
    textDecoration: "none",
    fontWeight: "800",
  },

  disabledButton: {
    opacity: 0.55,
    cursor: "not-allowed",
  },

  centerPage: {
    minHeight: "78vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "30px",
    background: "#fff8f5",
    fontFamily: "Arial, sans-serif",
  },

  messageCard: {
    width: "100%",
    maxWidth: "520px",
    padding: "42px",
    borderRadius: "20px",
    background: "#ffffff",
    boxShadow: "0 14px 38px rgba(0,0,0,0.07)",
    textAlign: "center",
  },

  loadingIcon: {
    fontSize: "55px",
  },

  loadingTitle: {
    color: "#1f2937",
  },

  errorIcon: {
    fontSize: "50px",
  },

  errorTitle: {
    color: "#dc2626",
  },

  mutedText: {
    color: "#6b7280",
    lineHeight: "1.6",
  },

  centerActions: {
    display: "flex",
    justifyContent: "center",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "18px",
  },

  retryButton: {
    padding: "12px 18px",
    border: "none",
    borderRadius: "9px",
    background: "#ff4d4f",
    color: "#ffffff",
    fontWeight: "800",
    cursor: "pointer",
  },

  backLink: {
    padding: "12px 18px",
    border: "1px solid #ff4d4f",
    borderRadius: "9px",
    color: "#ff4d4f",
    textDecoration: "none",
    fontWeight: "800",
  },
};

export default OrderDetailsPage;