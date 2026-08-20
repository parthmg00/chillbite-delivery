import {
  useEffect,
  useRef,
  useState,
} from "react";

import axiosInstance from "../api/axiosInstance.js";
import {
  getSocket,
} from "../api/socket.js";

function DeliveryDashboard() {
  const [orders, setOrders] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [
    trackingOrderId,
    setTrackingOrderId,
  ] = useState("");

  const watchIdRef =
    useRef(null);

  const socketRef =
    useRef(null);

  /*
   * ----------------------------------------------------
   * LOAD ASSIGNED ORDERS
   * ----------------------------------------------------
   */

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
      console.error(
        "Delivery orders error:",
        requestError
      );

      setError(
        requestError.response?.data
          ?.message ||
          "Assigned orders load nahi hue."
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * ----------------------------------------------------
   * INITIAL LOAD
   * ----------------------------------------------------
   */

  useEffect(() => {
    fetchOrders();

    const socket = getSocket();

    socketRef.current = socket;

    return () => {
      if (
        watchIdRef.current !== null
      ) {
        navigator.geolocation.clearWatch(
          watchIdRef.current
        );

        watchIdRef.current = null;
      }
    };
  }, []);

  /*
   * ----------------------------------------------------
   * START LIVE LOCATION
   * ----------------------------------------------------
   */

  const startTracking = (
    orderId
  ) => {
    setError("");
    setMessage("");

    if (
      !navigator.geolocation
    ) {
      setError(
        "Browser location support nahi karta."
      );

      return;
    }

    const socket =
      socketRef.current ||
      getSocket();

    socketRef.current = socket;

    /*
     * Existing GPS watcher stop.
     */

    if (
      watchIdRef.current !== null
    ) {
      navigator.geolocation.clearWatch(
        watchIdRef.current
      );

      watchIdRef.current = null;
    }

    /*
     * Tell backend:
     *
     * Delivery start.
     */

    socket.emit(
      "delivery:start",
      {
        orderId,
      }
    );

    setTrackingOrderId(
      orderId
    );

    setMessage(
      "Starting live location..."
    );

    /*
     * Browser GPS watcher.
     */

    watchIdRef.current =
      navigator.geolocation.watchPosition(
        (position) => {
          const location = {
            orderId,

            latitude:
              position.coords
                .latitude,

            longitude:
              position.coords
                .longitude,

            accuracy:
              position.coords
                .accuracy,

            speed:
              position.coords
                .speed,

            heading:
              position.coords
                .heading,
          };

          /*
           * REAL-TIME SOCKET EVENT
           */

          socket.emit(
            "delivery:location",
            location
          );

          console.log(
            "📍 GPS sent:",
            location
          );

          setMessage(
            `Live location active • ${location.latitude.toFixed(
              6
            )}, ${location.longitude.toFixed(
              6
            )}`
          );
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
              "Location permission denied. Browser settings me Location Allow karo."
            );
          } else if (
            locationError.code === 2
          ) {
            setError(
              "Current location read nahi ho rahi."
            );
          } else if (
            locationError.code === 3
          ) {
            setError(
              "Location request timeout ho gayi."
            );
          } else {
            setError(
              "GPS location error."
            );
          }
        },

        {
          /*
           * Mobile GPS accuracy better.
           */

          enableHighAccuracy: true,

          /*
           * GPS maximum wait.
           */

          timeout: 15000,

          /*
           * Old location maximum age.
           */

          maximumAge: 2000,
        }
      );

    fetchOrders();
  };

  /*
   * ----------------------------------------------------
   * STOP LIVE LOCATION
   * ----------------------------------------------------
   */

  const stopTracking = (
    orderId
  ) => {
    const socket =
      socketRef.current ||
      getSocket();

    if (
      watchIdRef.current !== null
    ) {
      navigator.geolocation.clearWatch(
        watchIdRef.current
      );

      watchIdRef.current = null;
    }

    socket.emit(
      "delivery:stop",
      {
        orderId,
      }
    );

    setTrackingOrderId("");

    setMessage(
      "Live location stopped."
    );

    fetchOrders();
  };

  /*
   * ----------------------------------------------------
   * MARK DELIVERED
   * ----------------------------------------------------
   */

  const markDelivered = (
    orderId
  ) => {
    const socket =
      socketRef.current ||
      getSocket();

    if (
      watchIdRef.current !== null
    ) {
      navigator.geolocation.clearWatch(
        watchIdRef.current
      );

      watchIdRef.current = null;
    }

    socket.emit(
      "delivery:delivered",
      {
        orderId,
      }
    );

    setTrackingOrderId("");

    setMessage(
      "Order delivered successfully."
    );

    fetchOrders();
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
          Assigned order select karke
          real-time location share karo.
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
            Abhi koi order assigned nahi
            hai.
          </div>
        ) : (
          orders.map((order) => {
            const isTracking =
              trackingOrderId ===
              order._id;

            return (
              <article
                key={order._id}
                style={styles.card}
              >
                <div
                  style={styles.row}
                >
                  <div>
                    <strong>
                      Order #
                      {order._id.slice(
                        -8
                      )}
                    </strong>

                    <p
                      style={
                        styles.small
                      }
                    >
                      {order.orderStatus}
                    </p>
                  </div>

                  <strong>
                    ₹
                    {order.totalPrice}
                  </strong>
                </div>

                <div
                  style={
                    styles.addressBox
                  }
                >
                  <strong>
                    Deliver To
                  </strong>

                  <p
                    style={
                      styles.small
                    }
                  >
                    {
                      order
                        .shippingAddress
                        ?.fullName
                    }
                  </p>

                  <p
                    style={
                      styles.small
                    }
                  >
                    {
                      order
                        .shippingAddress
                        ?.address
                    }
                    ,{" "}
                    {
                      order
                        .shippingAddress
                        ?.city
                    }
                    ,{" "}
                    {
                      order
                        .shippingAddress
                        ?.state
                    }{" "}
                    {
                      order
                        .shippingAddress
                        ?.pincode
                    }
                  </p>

                  <p
                    style={
                      styles.small
                    }
                  >
                    Phone:{" "}
                    {
                      order
                        .shippingAddress
                        ?.phone
                    }
                  </p>
                </div>

                <div
                  style={
                    styles.locationStatus
                  }
                >
                  <span
                    style={{
                      ...styles.statusDot,

                      background:
                        isTracking
                          ? "#10b981"
                          : "#9ca3af",
                    }}
                  />

                  {isTracking
                    ? "GPS Live • Sharing location"
                    : "Location not sharing"}
                </div>

                <div
                  style={
                    styles.buttons
                  }
                >
                  {!isTracking ? (
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
            );
          })
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
    fontFamily:
      "Arial, sans-serif",
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
    justifyContent:
      "space-between",
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

  locationStatus: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "15px",
    padding: "10px 12px",
    background: "#f9fafb",
    borderRadius: "10px",
    color: "#374151",
    fontWeight: "700",
    fontSize: "13px",
  },

  statusDot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    display: "inline-block",
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

export default DeliveryDashboard