import { Link, useLocation, useParams } from "react-router-dom";

function OrderSuccessPage() {
  const { id } = useParams();
  const location = useLocation();

  const order = location.state?.order;

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <div style={styles.icon}>✓</div>

        <p style={styles.label}>ORDER CONFIRMED</p>

        <h1 style={styles.title}>Order Placed Successfully!</h1>

        <p style={styles.description}>
          Thank you! Tumhara order successfully receive ho gaya hai.
        </p>

        <div style={styles.orderBox}>
          <span>Order ID</span>
          <strong>#{order?._id || id}</strong>
        </div>

        {order?.totalPrice !== undefined && (
          <div style={styles.orderBox}>
            <span>Total Amount</span>
            <strong>₹{Number(order.totalPrice).toFixed(2)}</strong>
          </div>
        )}

        <p style={styles.deliveryText}>
          Estimated delivery: 30–45 minutes
        </p>

        <div style={styles.actions}>
          <Link to="/orders" style={styles.primaryLink}>
            View My Orders
          </Link>

          <Link to="/products" style={styles.secondaryLink}>
            Continue Shopping
          </Link>
        </div>
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "82vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "40px 20px",
    background:
      "linear-gradient(135deg, #fff8f5 0%, #ffe9e2 100%)",
    fontFamily: "Arial, sans-serif",
  },

  card: {
    width: "100%",
    maxWidth: "620px",
    padding: "48px 35px",
    borderRadius: "24px",
    background: "#ffffff",
    boxShadow: "0 20px 50px rgba(0, 0, 0, 0.1)",
    textAlign: "center",
  },

  icon: {
    width: "82px",
    height: "82px",
    margin: "0 auto 22px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: "50%",
    background: "#dcfce7",
    color: "#16a34a",
    fontSize: "45px",
    fontWeight: "900",
  },

  label: {
    margin: "0 0 10px",
    color: "#16a34a",
    fontSize: "13px",
    fontWeight: "900",
    letterSpacing: "1.4px",
  },

  title: {
    margin: "0 0 13px",
    color: "#1f2937",
    fontSize: "34px",
  },

  description: {
    margin: "0 0 28px",
    color: "#6b7280",
    lineHeight: "1.7",
  },

  orderBox: {
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    marginBottom: "12px",
    padding: "15px",
    borderRadius: "11px",
    background: "#f9fafb",
    color: "#374151",
    overflowWrap: "anywhere",
  },

  deliveryText: {
    margin: "22px 0",
    color: "#4b5563",
    fontWeight: "700",
  },

  actions: {
    display: "flex",
    justifyContent: "center",
    gap: "12px",
    flexWrap: "wrap",
  },

  primaryLink: {
    padding: "13px 19px",
    borderRadius: "10px",
    background: "#ff4d4f",
    color: "#ffffff",
    textDecoration: "none",
    fontWeight: "800",
  },

  secondaryLink: {
    padding: "13px 19px",
    border: "1px solid #ff4d4f",
    borderRadius: "10px",
    color: "#ff4d4f",
    textDecoration: "none",
    fontWeight: "800",
  },
};

export default OrderSuccessPage;