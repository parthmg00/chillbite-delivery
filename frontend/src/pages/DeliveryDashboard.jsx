import {
  useEffect,
  useRef,
  useState,
} from "react";

import axiosInstance from "../api/axiosInstance.js";

function DeliveryDashboard() {
  const [orders, setOrders] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [trackingOrderId, setTrackingOrderId] =
    useState("");

  const watchIdRef = useRef(null);

  const lastSentAtRef = useRef(0);

  const fetchOrders = async () => {
    try {
      const response =
        await axiosInstance.get(
          "/delivery/orders/mine"
        );

      setOrders(
        response.data?.orders || []
      );
    } catch (requestError) {
      setError(
        requestError.response?.data
          ?.message ||
          "Assigned orders load nahi hue."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    return () => {
      if (
        watchIdRef.current !== null
      ) {
        navigator.geolocation.clearWatch(
          watchIdRef.current
        );
      }
    };
  }, []);

  const startTracking = async (orderId) => {
    setError("");
    setMessage("");

    if (!navigator.geolocation) {
      setError(
        "Browser location support nahi karta."
      );
      return;
    }

    try {
      await axiosInstance.put(
        `/delivery/orders/${orderId}/start`
      );

      setTrackingOrderId(orderId);

      /*
       * Existing watch ho to clear.
       */
      if (
        watchIdRef.current !== null
      ) {
        navigator.geolocation.clearWatch(
          watchIdRef.current
        );
      }

      watchIdRef.current =
        navigator.geolocation.watchPosition(
          async (position) => {
            /*
             * Backend ko max every 5 sec
             * update bhejenge.
             */
            const now = Date.now();

            if (
              now -
                lastSentAtRef.current <
              5000
            ) {
              return;
            }

            lastSentAtRef.current = now;

            try {
              await axiosInstance.put(
                `/delivery/orders/${orderId}/location`,
                {
                  latitude:
                    position.coords.latitude,

                  longitude:
                    position.coords.longitude,

                  accuracy:
                    position.coords.accuracy,

                  speed:
                    position.coords.speed,

                  heading:
                    position.coords.heading,
                }
              );

              setMessage(
                "Live location sharing active."
              );
            } catch (requestError) {
              console.error(
                "Location update error:",
                requestError
              );
            }
          },

          (locationError) => {
            console.error(
              "Geolocation error:",
              locationError
            );

            if (
              locationError.code === 1
            ) {
              setError(
                "Location permission denied. Browser settings me Allow karo."
              );
            } else {
              setError(
                "Current location read nahi ho rahi."
              );
            }
          },

          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 3000,
          }
        );

      await fetchOrders();
    } catch (requestError) {
      setError(
        requestError.response?.data
          ?.message ||
          "Tracking start nahi hui."
      );
    }
  };

  const stopTracking = async (orderId) => {
    try {
      if (
        watchIdRef.current !== null
      ) {
        navigator.geolocation.clearWatch(
          watchIdRef.current
        );

        watchIdRef.current = null;
      }

      await axiosInstance.put(
        `/delivery/orders/${orderId}/stop`
      );

      setTrackingOrderId("");

      setMessage(
        "Live location stopped."
      );

      fetchOrders();
    } catch (requestError) {
      setError(
        requestError.response?.data
          ?.message ||
          "Tracking stop nahi hui."
      );
    }
  };

  const markDelivered = async (
    orderId
  ) => {
    try {
      if (
        watchIdRef.current !== null
      ) {
        navigator.geolocation.clearWatch(
          watchIdRef.current
        );

        watchIdRef.current = null;
      }

      await axiosInstance.put(
        `/delivery/orders/${orderId}/delivered`
      );

      setTrackingOrderId("");

      setMessage(
        "Order delivered successfully."
      );

      fetchOrders();
    } catch (requestError) {
      setError(
        requestError.response?.data
          ?.message ||
          "Delivered mark nahi hua."
      );
    }
  };

  if (loading) {
    return (
      <main style={styles.page}>
        Loading delivery orders...
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <p style={styles.eyebrow}>
          CHILLBITE DELIVERY
        </p>

        <h1 style={styles.title}>
          Delivery Dashboard
        </h1>

        <p style={styles.subtitle}>
          Assigned order select karke live
          location share karo.
        </p>

        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}

        {message && (
          <div style={styles.success}>
            {message}
          </div>
        )}

        {orders.length === 0 ? (
          <div style={styles.empty}>
            Abhi koi order assigned nahi hai.
          </div>
        ) : (
          orders.map((order) => (
            <article
              key={order._id}
              style={styles.card}
            >
              <div style={styles.row}>
                <div>
                  <strong>
                    Order #
                    {order._id.slice(-8)}
                  </strong>

                  <p style={styles.small}>
                    {order.orderStatus}
                  </p>
                </div>

                <strong>
                  ₹{order.totalPrice}
                </strong>
              </div>

              <div style={styles.addressBox}>
                <strong>
                  Deliver To
                </strong>

                <p style={styles.small}>
                  {
                    order.shippingAddress
                      ?.fullName
                  }
                </p>

                <p style={styles.small}>
                  {
                    order.shippingAddress
                      ?.address
                  }
                  ,{" "}
                  {
                    order.shippingAddress
                      ?.city
                  }
                  ,{" "}
                  {
                    order.shippingAddress
                      ?.state
                  }{" "}
                  {
                    order.shippingAddress
                      ?.pincode
                  }
                </p>

                <p style={styles.small}>
                  Phone:{" "}
                  {
                    order.shippingAddress
                      ?.phone
                  }
                </p>
              </div>

              <div style={styles.buttons}>
                {trackingOrderId !==
                order._id ? (
                  <button
                    type="button"
                    onClick={() =>
                      startTracking(
                        order._id
                      )
                    }
                    style={
                      styles.startButton
                    }
                  >
                    📍 Start Live Location
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      stopTracking(
                        order._id
                      )
                    }
                    style={
                      styles.stopButton
                    }
                  >
                    Stop Location
                  </button>
                )}

                <button
                  type="button"
                  onClick={() =>
                    markDelivered(
                      order._id
                    )
                  }
                  style={
                    styles.deliveredButton
                  }
                >
                  ✓ Delivered
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "40px 20px",
    background: "#fff8f5",
    fontFamily: "Arial, sans-serif",
  },

  container: {
    maxWidth: "850px",
    margin: "0 auto",
  },

  eyebrow: {
    color: "#ff4d4f",
    fontWeight: "900",
    letterSpacing: "1px",
  },

  title: {
    marginBottom: "5px",
  },

  subtitle: {
    color: "#6b7280",
    marginBottom: "25px",
  },

  card: {
    padding: "22px",
    marginBottom: "18px",
    background: "#ffffff",
    borderRadius: "16px",
    boxShadow:
      "0 10px 30px rgba(0,0,0,0.07)",
  },

  row: {
    display: "flex",
    justifyContent: "space-between",
  },

  addressBox: {
    margin: "15px 0",
    padding: "14px",
    background: "#f9fafb",
    borderRadius: "10px",
  },

  small: {
    margin: "5px 0",
    color: "#6b7280",
    lineHeight: "1.5",
  },

  buttons: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },

  startButton: {
    padding: "12px 16px",
    border: "none",
    borderRadius: "9px",
    background: "#ff4d4f",
    color: "#ffffff",
    fontWeight: "800",
    cursor: "pointer",
  },

  stopButton: {
    padding: "12px 16px",
    border: "none",
    borderRadius: "9px",
    background: "#f59e0b",
    color: "#ffffff",
    fontWeight: "800",
    cursor: "pointer",
  },

  deliveredButton: {
    padding: "12px 16px",
    border: "none",
    borderRadius: "9px",
    background: "#10b981",
    color: "#ffffff",
    fontWeight: "800",
    cursor: "pointer",
  },

  error: {
    padding: "12px",
    marginBottom: "15px",
    background: "#fef2f2",
    color: "#dc2626",
    borderRadius: "9px",
  },

  success: {
    padding: "12px",
    marginBottom: "15px",
    background: "#ecfdf5",
    color: "#047857",
    borderRadius: "9px",
  },

  empty: {
    padding: "25px",
    background: "#ffffff",
    borderRadius: "14px",
  },
};

export default DeliveryDashboard;