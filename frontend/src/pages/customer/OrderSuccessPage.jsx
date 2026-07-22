import { useMemo } from "react";

import {
  Link,
  useLocation,
} from "react-router-dom";

function OrderSuccessPage() {
  const location = useLocation();

  const order = useMemo(() => {
    if (location.state?.order) {
      return location.state.order;
    }

    try {
      return JSON.parse(
        localStorage.getItem(
          "latestOrder"
        )
      );
    } catch {
      return null;
    }
  }, [location.state]);

  return (
    <main className="order-success-page page-container">
      <section className="order-success-card">
        <div className="order-success-icon">
          ✓
        </div>

        <span className="order-success-label">
          Order confirmed
        </span>

        <h1>Your order has been placed!</h1>

        <p className="order-success-description">
          Thank you for ordering from ChillBite.
          Your delicious items will be prepared
          shortly.
        </p>

        {order && (
          <div className="order-success-details">
            <div>
              <span>Order number</span>

              <strong>
                {order.orderNumber ||
                  "Order placed"}
              </strong>
            </div>

            <div>
              <span>Total amount</span>

              <strong>
                ₹{order.totalAmount || 0}
              </strong>
            </div>

            <div>
              <span>Payment</span>

              <strong>
                {order.paymentMethod ===
                "cash-on-delivery"
                  ? "Cash on Delivery"
                  : order.paymentMethod}
              </strong>
            </div>

            <div>
              <span>Status</span>

              <strong className="order-status-badge">
                {order.orderStatus ||
                  "placed"}
              </strong>
            </div>
          </div>
        )}

        <div className="order-success-actions">
          <Link
            to="/my-orders"
            className="primary-button"
          >
            View My Orders
          </Link>

          <Link
            to="/"
            className="secondary-button"
          >
            Continue Shopping
          </Link>
        </div>
      </section>
    </main>
  );
}

export default OrderSuccessPage;