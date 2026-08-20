import {
  useEffect,
  useState,
} from "react";

import LiveTrackingMap from "./LiveTrackingMap.jsx";

import {
  getSocket,
} from "../api/socket.js";

function LiveOrderTracking({
  orderId,
}) {
  const [
    trackingData,
    setTrackingData,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    liveLocation,
    setLiveLocation,
  ] = useState(null);

  useEffect(() => {
    if (!orderId) {
      return;
    }

    const socket =
      getSocket();

    /*
     * ------------------------------------------------
     * CONNECT TO ORDER ROOM
     * ------------------------------------------------
     */

    socket.emit(
      "tracking:join",
      {
        orderId,
      }
    );

    /*
     * ------------------------------------------------
     * INITIAL STATE
     * ------------------------------------------------
     */

    const handleState = (
      data
    ) => {
      console.log(
        "📦 Initial tracking:",
        data
      );

      setTrackingData(data);

      const tracking =
        data?.tracking;

      if (
        tracking?.latitude != null &&
        tracking?.longitude != null
      ) {
        setLiveLocation({
          latitude:
            Number(
              tracking.latitude
            ),

          longitude:
            Number(
              tracking.longitude
            ),
        });
      }

      setLoading(false);
      setError("");
    };

    /*
     * ------------------------------------------------
     * REAL-TIME LOCATION
     * ------------------------------------------------
     */

    const handleLocation = (
      location
    ) => {
      console.log(
        "🚴 LIVE LOCATION RECEIVED:",
        location
      );

      setLiveLocation({
        latitude:
          Number(
            location.latitude
          ),

        longitude:
          Number(
            location.longitude
          ),
      });

      setTrackingData(
        (previous) => {
          if (!previous) {
            return previous;
          }

          return {
            ...previous,

            tracking: {
              ...previous.tracking,

              latitude:
                location.latitude,

              longitude:
                location.longitude,

              accuracy:
                location.accuracy,

              speed:
                location.speed,

              heading:
                location.heading,

              lastUpdatedAt:
                location.lastUpdatedAt,
            },
          };
        }
      );
    };

    /*
     * ------------------------------------------------
     * TRACKING STARTED
     * ------------------------------------------------
     */

    const handleStarted = (
      data
    ) => {
      console.log(
        "🚴 Delivery started:",
        data
      );

      setTrackingData(
        (previous) => ({
          ...previous,

          orderStatus:
            data.orderStatus,

          tracking:
            data.tracking,
        })
      );
    };

    /*
     * ------------------------------------------------
     * TRACKING STOPPED
     * ------------------------------------------------
     */

    const handleStopped = (
      data
    ) => {
      setTrackingData(
        (previous) => ({
          ...previous,

          tracking:
            data.tracking,
        })
      );
    };

    /*
     * ------------------------------------------------
     * DELIVERED
     * ------------------------------------------------
     */

    const handleDelivered = (
      data
    ) => {
      setTrackingData(
        (previous) => ({
          ...previous,

          orderStatus:
            "Delivered",

          tracking:
            data.tracking,
        })
      );
    };

    /*
     * ------------------------------------------------
     * ERRORS
     * ------------------------------------------------
     */

    const handleError = (
      data
    ) => {
      console.error(
        "Tracking socket error:",
        data
      );

      setError(
        data?.message ||
          "Live tracking error."
      );

      setLoading(false);
    };

    socket.on(
      "tracking:state",
      handleState
    );

    socket.on(
      "delivery:location",
      handleLocation
    );

    socket.on(
      "delivery:started",
      handleStarted
    );

    socket.on(
      "delivery:stopped",
      handleStopped
    );

    socket.on(
      "delivery:delivered",
      handleDelivered
    );

    socket.on(
      "tracking:error",
      handleError
    );

    /*
     * ------------------------------------------------
     * CLEANUP
     * ------------------------------------------------
     */

    return () => {
      socket.off(
        "tracking:state",
        handleState
      );

      socket.off(
        "delivery:location",
        handleLocation
      );

      socket.off(
        "delivery:started",
        handleStarted
      );

      socket.off(
        "delivery:stopped",
        handleStopped
      );

      socket.off(
        "delivery:delivered",
        handleDelivered
      );

      socket.off(
        "tracking:error",
        handleError
      );
    };
  }, [orderId]);

  if (loading) {
    return (
      <div style={styles.box}>
        Connecting to live tracking...
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorBox}>
        {error}
      </div>
    );
  }

  const tracking =
    trackingData?.tracking;

  const deliveryBoy =
    trackingData?.deliveryBoy;

  const shipping =
    trackingData?.shippingAddress;

  /*
   * IMPORTANT:
   *
   * liveLocation is coming directly
   * from Socket.IO.
   */

  const deliveryLocation =
    liveLocation ||
    (
      tracking?.latitude != null &&
      tracking?.longitude != null
    )
      ? {
          latitude:
            Number(
              liveLocation?.latitude ??
                tracking?.latitude
            ),

          longitude:
            Number(
              liveLocation?.longitude ??
                tracking?.longitude
            ),
        }
      : null;

  const customerLocation =
    shipping?.latitude != null &&
    shipping?.longitude != null
      ? {
          latitude:
            Number(
              shipping.latitude
            ),

          longitude:
            Number(
              shipping.longitude
            ),
        }
      : null;

  const isActive =
    Boolean(
      tracking?.isActive
    );

  return (
    <section
      style={styles.card}
    >
      <div style={styles.header}>
        <div>
          <p
            style={
              styles.eyebrow
            }
          >
            LIVE DELIVERY
          </p>

          <h2
            style={
              styles.title
            }
          >
            Track Your Order
          </h2>
        </div>

        <span
          style={
            styles.status
          }
        >
          {trackingData?.orderStatus}
        </span>
      </div>

      {deliveryBoy && (
        <div
          style={
            styles.partner
          }
        >
          <div>
            <strong>
              🛵{" "}
              {deliveryBoy.name}
            </strong>

            <p
              style={
                styles.smallText
              }
            >
              Your Delivery Partner
            </p>
          </div>

          {deliveryBoy.phone && (
            <a
              href={tel:${deliveryBoy.phone}}
              style={
                styles.callButton
              }
            >
              Call
            </a>
          )}
        </div>
      )}

      {isActive &&
      deliveryLocation ? (
        <>
          <LiveTrackingMap
            deliveryLocation={
              deliveryLocation
            }
            customerLocation={
              customerLocation
            }
          />

          <div
            style={
              styles.liveRow
            }
          >
            <span
              style={
                styles.liveDot
              }
            />

            LIVE • Rider location updating
          </div>

          <p
            style={
              styles.smallText
            }
          >
            Last updated:{" "}
            {tracking?.lastUpdatedAt
              ? new Date(
                  tracking.lastUpdatedAt
                ).toLocaleTimeString()
              : "Just now"}
          </p>
        </>
      ) : (
        <div
          style={
            styles.waitingBox
          }
        >
          <strong>
            Delivery tracking abhi
            active nahi hai.
          </strong>

          <p
            style={
              styles.smallText
            }
          >
            Delivery partner jab
            delivery start karega,
            live location yahan
            automatically appear
            hogi.
          </p>
        </div>
      )}
    </section>
  );
}

const styles = {
  card: {
    marginTop: "25px",
    padding: "24px",
    background: "#ffffff",
    borderRadius: "18px",
    boxShadow:
      "0 12px 35px rgba(0,0,0,0.07)",
  },

  header: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    gap: "15px",
    marginBottom: "20px",
  },

  eyebrow: {
    margin: "0 0 5px",
    color: "#ff4d4f",
    fontSize: "12px",
    fontWeight: "900",
    letterSpacing: "1px",
  },

  title: {
    margin: 0,
    color: "#1f2937",
  },

  status: {
    padding: "8px 12px",
    background: "#fff1f2",
    color: "#e11d48",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: "800",
  },

  partner: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    padding: "14px",
    marginBottom: "18px",
    background: "#f9fafb",
    borderRadius: "12px",
  },

  callButton: {
    padding: "9px 14px",
    background: "#ff4d4f",
    color: "#ffffff",
    borderRadius: "9px",
    textDecoration: "none",
    fontWeight: "800",
  },

  liveRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginTop: "14px",
    color: "#047857",
    fontWeight: "800",
  },

  liveDot: {
    width: "10px",
    height: "10px",
    background: "#10b981",
    borderRadius: "50%",
    boxShadow:
      "0 0 0 5px rgba(16,185,129,0.12)",
  },

  smallText: {
    margin: "5px 0 0",
    color: "#6b7280",
    fontSize: "13px",
    lineHeight: "1.5",
  },

  waitingBox: {
    padding: "20px",
    background: "#fff7ed",
    borderRadius: "12px",
    color: "#9a3412",
  },

  box: {
    padding: "20px",
  },

  errorBox: {
    padding: "15px",
    background: "#fef2f2",
    color: "#dc2626",
    borderRadius: "10px",
  },
};

export default LiveOrderTracking;