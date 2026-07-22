import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import axiosInstance from "../api/axiosInstance.js";

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

function MyOrdersPage() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingOrderId, setCancellingOrderId] = useState("");

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axiosInstance.get("/orders/my-orders");

      const receivedOrders =
        response.data?.orders ||
        response.data?.data?.orders ||
        [];

      setOrders(receivedOrders);
    } catch (requestError) {
      console.error("Orders fetch error:", requestError);

      setError(
        requestError.response?.data?.message ||
          "Orders load nahi hue."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancelOrder = async (orderId) => {
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
      setCancellingOrderId(orderId);

      const response = await axiosInstance.put(
        `/orders/${orderId}/cancel`,
        {
          reason: reason.trim(),
        }
      );

      const updatedOrder =
        response.data?.order ||
        response.data?.data?.order;

      if (updatedOrder) {
        setOrders((currentOrders) =>
          currentOrders.map((order) =>
            order._id === orderId
              ? updatedOrder
              : order
          )
        );
      } else {
        await fetchOrders();
      }

      const refundAmount = Number(
        response.data?.refundedAmount || 0
      );

      if (refundAmount > 0) {
        window.alert(
          `Order cancel ho gaya. ₹${refundAmount.toFixed(
            2
          )} tumhare wallet me refund ho gaya.`
        );
      } else {
        window.alert(
          response.data?.message ||
            "Order successfully cancel ho gaya."
        );
      }
    } catch (requestError) {
      console.error("Cancel order error:", requestError);

      window.alert(
        requestError.response?.data?.message ||
          "Order cancel nahi ho saka."
      );
    } finally {
      setCancellingOrderId("");
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
      normalizedStatus === "out for delivery" ||
      normalizedStatus === "confirmed"
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

  const canCancelOrder = (order) => {
    return cancellableStatuses.includes(
      order.orderStatus
    );
  };

  const openRatingPage = (orderId, productId) => {
    navigate(
      `/reviews/new?orderId=${orderId}&productId=${productId}`
    );
  };

  const openSupportPage = (orderId) => {
    navigate(`/support?orderId=${orderId}`);
  };

  if (loading) {
    return (
      <main style={styles.centerPage}>
        <section style={styles.messageCard}>
          <div style={styles.loadingIcon}>🍨</div>
          <h2 style={styles.loadingTitle}>
            Loading your orders...
          </h2>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main style={styles.centerPage}>
        <section style={styles.messageCard}>
          <h2 style={styles.errorTitle}>
            Unable to load orders
          </h2>

          <p style={styles.mutedText}>{error}</p>

          <button
            type="button"
            onClick={fetchOrders}
            style={styles.retryButton}
          >
            Try Again
          </button>
        </section>
      </main>
    );
  }

  if (orders.length === 0) {
    return (
      <main style={styles.centerPage}>
        <section style={styles.messageCard}>
          <div style={styles.emptyIcon}>📦</div>

          <h1 style={styles.emptyTitle}>
            No orders yet
          </h1>

          <p style={styles.mutedText}>
            Tumne abhi tak koi order place nahi kiya.
          </p>

          <Link to="/products" style={styles.shopLink}>
            Start Shopping
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <div style={styles.headingBox}>
          <p style={styles.eyebrow}>
            ORDER HISTORY
          </p>

          <h1 style={styles.pageTitle}>
            My Orders
          </h1>

          <p style={styles.mutedText}>
            Apne orders, payment, refund aur delivery
            status ko yahan manage karo.
          </p>
        </div>

        <div style={styles.orderList}>
          {orders.map((order) => {
            const statusIndex = getTrackingStepIndex(
              order.orderStatus
            );

            const isCancelled =
              order.orderStatus === "Cancelled";

            const isDelivered =
              order.orderStatus === "Delivered";

            const isCancelling =
              cancellingOrderId === order._id;

            return (
              <article
                key={order._id}
                style={styles.orderCard}
              >
                <div style={styles.orderHeader}>
                  <div>
                    <p style={styles.orderLabel}>
                      ORDER ID
                    </p>

                    <h2 style={styles.orderId}>
                      #{order._id}
                    </h2>
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

                <div style={styles.orderMeta}>
                  <div>
                    <span style={styles.metaLabel}>
                      Placed On
                    </span>

                    <strong style={styles.metaValue}>
                      {order.createdAt
                        ? new Date(
                            order.createdAt
                          ).toLocaleString()
                        : "Not available"}
                    </strong>
                  </div>

                  <div>
                    <span style={styles.metaLabel}>
                      Payment Method
                    </span>

                    <strong style={styles.metaValue}>
                      {order.paymentMethod ||
                        "Cash on Delivery"}
                    </strong>
                  </div>

                  <div>
                    <span style={styles.metaLabel}>
                      Payment Status
                    </span>

                    <strong
                      style={{
                        ...styles.metaValue,
                        ...getPaymentStatusStyle(
                          order.paymentStatus
                        ),
                      }}
                    >
                      {order.paymentStatus ||
                        "Pending"}
                    </strong>
                  </div>

                  <div>
                    <span style={styles.metaLabel}>
                      Total
                    </span>

                    <strong style={styles.totalPrice}>
                      ₹
                      {Number(
                        order.totalPrice || 0
                      ).toFixed(2)}
                    </strong>
                  </div>
                </div>

                {!isCancelled && (
                  <section style={styles.trackingBox}>
                    <h3 style={styles.sectionTitle}>
                      Order Tracking
                    </h3>

                    <div style={styles.trackingSteps}>
                      {trackingSteps.map(
                        (step, index) => {
                          const completed =
                            index <= statusIndex;

                          return (
                            <div
                              key={step}
                              style={
                                styles.trackingItem
                              }
                            >
                              <div
                                style={{
                                  ...styles.trackingCircle,
                                  ...(completed
                                    ? styles.trackingCircleActive
                                    : {}),
                                }}
                              >
                                {completed ? "✓" : index + 1}
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

                <div style={styles.itemsBox}>
                  {order.items?.map(
                    (item, index) => {
                      const productId =
                        item.product?._id ||
                        item.product;

                      return (
                        <div
                          key={`${order._id}-${productId}-${index}`}
                          style={styles.itemRow}
                        >
                          <img
                            src={
                              item.image ||
                              "https://placehold.co/80x80?text=Product"
                            }
                            alt={
                              item.name || "Product"
                            }
                            style={styles.itemImage}
                          />

                          <div style={styles.itemInfo}>
                            <strong>
                              {item.name ||
                                "Product"}
                            </strong>

                            <span
                              style={
                                styles.itemQuantity
                              }
                            >
                              Qty: {item.quantity}
                            </span>
                          </div>

                          <div
                            style={
                              styles.itemRightSide
                            }
                          >
                            <strong>
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

                            {isDelivered &&
                              !item.isReviewed && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    openRatingPage(
                                      order._id,
                                      productId
                                    )
                                  }
                                  style={
                                    styles.rateButton
                                  }
                                >
                                  ⭐ Rate Product
                                </button>
                              )}

                            {isDelivered &&
                              item.isReviewed && (
                                <span
                                  style={
                                    styles.reviewedText
                                  }
                                >
                                  ✓ Reviewed
                                </span>
                              )}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>

                <div style={styles.addressBox}>
                  <strong>Delivering to:</strong>

                  <span>
                    {order.shippingAddress?.fullName}
                    ,{" "}
                    {order.shippingAddress?.address},{" "}
                    {order.shippingAddress?.city},{" "}
                    {order.shippingAddress?.state} -{" "}
                    {order.shippingAddress?.pincode}
                  </span>

                  {order.shippingAddress?.phone && (
                    <span>
                      Phone:{" "}
                      {order.shippingAddress.phone}
                    </span>
                  )}
                </div>

                {isCancelled && (
                  <section style={styles.cancelledBox}>
                    <h3
                      style={styles.cancelledTitle}
                    >
                      Order Cancelled
                    </h3>

                    <div style={styles.cancelInfoRow}>
                      <strong>Reason:</strong>

                      <span>
                        {order.cancellation?.reason ||
                          "No reason provided"}
                      </span>
                    </div>

                    {order.cancellation
                      ?.cancelledAt && (
                      <div
                        style={styles.cancelInfoRow}
                      >
                        <strong>
                          Cancelled on:
                        </strong>

                        <span>
                          {new Date(
                            order.cancellation
                              .cancelledAt
                          ).toLocaleString()}
                        </span>
                      </div>
                    )}

                    <div style={styles.cancelInfoRow}>
                      <strong>
                        Refund status:
                      </strong>

                      <span>
                        {order.refundStatus ||
                          "Not Applicable"}
                      </span>
                    </div>

                    {order.refundStatus ===
                      "Completed" && (
                      <div
                        style={styles.refundSuccessBox}
                      >
                        ₹
                        {Number(
                          order.refundedAmount || 0
                        ).toFixed(2)}{" "}
                        tumhare ChillBite Wallet me
                        successfully refund ho gaya.
                      </div>
                    )}
                  </section>
                )}

                <div style={styles.actionRow}>
                  {canCancelOrder(order) && (
                    <button
                      type="button"
                      disabled={isCancelling}
                      onClick={() =>
                        handleCancelOrder(order._id)
                      }
                      style={{
                        ...styles.cancelButton,
                        ...(isCancelling
                          ? styles.disabledButton
                          : {}),
                      }}
                    >
                      {isCancelling
                        ? "Cancelling..."
                        : "Cancel Order"}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      openSupportPage(order._id)
                    }
                    style={styles.supportButton}
                  >
                    🎧 Customer Support
                  </button>

                  <Link
                    to={`/orders/${order._id}`}
                    style={styles.detailsLink}
                  >
                    View Details
                  </Link>
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
    padding: "45px 20px 70px",
    background: "#fff8f5",
    fontFamily: "Arial, sans-serif",
  },

  container: {
    width: "100%",
    maxWidth: "1050px",
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

  orderList: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },

  orderCard: {
    padding: "27px",
    borderRadius: "18px",
    background: "#ffffff",
    boxShadow:
      "0 12px 35px rgba(0, 0, 0, 0.07)",
  },

  orderHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "18px",
    paddingBottom: "18px",
    borderBottom: "1px solid #eeeeee",
  },

  orderLabel: {
    margin: "0 0 5px",
    color: "#9ca3af",
    fontSize: "11px",
    fontWeight: "900",
    letterSpacing: "1px",
  },

  orderId: {
    margin: 0,
    color: "#1f2937",
    fontSize: "18px",
    overflowWrap: "anywhere",
  },

  statusBadge: {
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900",
    whiteSpace: "nowrap",
  },

  orderMeta: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "18px",
    margin: "22px 0",
  },

  metaLabel: {
    display: "block",
    marginBottom: "6px",
    color: "#9ca3af",
    fontSize: "12px",
    fontWeight: "800",
  },

  metaValue: {
    color: "#374151",
    fontSize: "14px",
  },

  totalPrice: {
    color: "#ff4d4f",
    fontSize: "18px",
  },

  sectionTitle: {
    margin: "0 0 17px",
    color: "#1f2937",
    fontSize: "17px",
  },

  trackingBox: {
    marginBottom: "22px",
    padding: "18px",
    borderRadius: "13px",
    background: "#f9fafb",
    overflowX: "auto",
  },

  trackingSteps: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    minWidth: "650px",
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
    width: "32px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
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

  itemsBox: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  itemRow: {
    display: "flex",
    alignItems: "center",
    gap: "13px",
    padding: "12px",
    borderRadius: "12px",
    background: "#f9fafb",
  },

  itemImage: {
    width: "60px",
    height: "60px",
    borderRadius: "9px",
    objectFit: "cover",
    background: "#e5e7eb",
  },

  itemInfo: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "5px",
    color: "#1f2937",
  },

  itemQuantity: {
    color: "#6b7280",
    fontSize: "13px",
  },

  itemRightSide: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "8px",
  },

  rateButton: {
    padding: "7px 10px",
    border: "1px solid #f59e0b",
    borderRadius: "8px",
    background: "#fffbeb",
    color: "#b45309",
    fontSize: "12px",
    fontWeight: "800",
    cursor: "pointer",
  },

  reviewedText: {
    color: "#15803d",
    fontSize: "12px",
    fontWeight: "800",
  },

  addressBox: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
    marginTop: "20px",
    padding: "15px",
    borderRadius: "11px",
    background: "#fff5f2",
    color: "#4b5563",
    lineHeight: "1.6",
  },

  cancelledBox: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginTop: "18px",
    padding: "17px",
    border: "1px solid #fecaca",
    borderRadius: "12px",
    background: "#fef2f2",
    color: "#991b1b",
  },

  cancelledTitle: {
    margin: 0,
    color: "#dc2626",
    fontSize: "17px",
  },

  cancelInfoRow: {
    display: "flex",
    gap: "7px",
    flexWrap: "wrap",
    fontSize: "14px",
  },

  refundSuccessBox: {
    marginTop: "5px",
    padding: "12px",
    borderRadius: "9px",
    background: "#dcfce7",
    color: "#15803d",
    fontSize: "14px",
    fontWeight: "800",
    lineHeight: "1.5",
  },

  actionRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginTop: "20px",
    flexWrap: "wrap",
  },

  cancelButton: {
    padding: "11px 16px",
    border: "1px solid #dc2626",
    borderRadius: "9px",
    background: "#ffffff",
    color: "#dc2626",
    fontWeight: "800",
    cursor: "pointer",
  },

  supportButton: {
    padding: "11px 16px",
    border: "1px solid #2563eb",
    borderRadius: "9px",
    background: "#eff6ff",
    color: "#1d4ed8",
    fontWeight: "800",
    cursor: "pointer",
  },

  detailsLink: {
    padding: "11px 16px",
    borderRadius: "9px",
    background: "#ff4d4f",
    color: "#ffffff",
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
    boxShadow:
      "0 14px 38px rgba(0,0,0,0.07)",
    textAlign: "center",
  },

  loadingIcon: {
    fontSize: "55px",
  },

  loadingTitle: {
    color: "#1f2937",
  },

  emptyIcon: {
    fontSize: "60px",
  },

  emptyTitle: {
    marginTop: "12px",
    color: "#1f2937",
  },

  errorTitle: {
    color: "#dc2626",
  },

  retryButton: {
    marginTop: "14px",
    padding: "12px 19px",
    border: "none",
    borderRadius: "9px",
    background: "#ff4d4f",
    color: "#ffffff",
    fontWeight: "800",
    cursor: "pointer",
  },

  shopLink: {
    display: "inline-block",
    marginTop: "15px",
    padding: "13px 20px",
    borderRadius: "10px",
    background: "#ff4d4f",
    color: "#ffffff",
    textDecoration: "none",
    fontWeight: "800",
  },
};

export default MyOrdersPage;