import {
  useEffect,
  useState,
} from "react";

import axiosInstance from "../api/axiosInstance.js";

import LiveTrackingMap from "./LiveTrackingMap.jsx";

function LiveOrderTracking({ orderId }) {
  const [trackingData, setTrackingData] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const fetchTracking = async () => {
    try {
      const response =
        await axiosInstance.get(
          `/delivery/orders/${orderId}/tracking`
        );

      setTrackingData(response.data);

      setError("");
    } catch (requestError) {
      console.error(
        "Tracking fetch error:",
        requestError
      );

      setError(
        requestError.response?.data
          ?.message ||
          "Live tracking load nahi hui."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!orderId) {
      return undefined;
    }

    fetchTracking();

    const intervalId = setInterval(
      fetchTracking,
      5000
    );

    return () => {
      clearInterval(intervalId);
    };
  }, [orderId]);

  if (loading) {
    return (
      <div style={styles.box}>
        Loading live tracking...
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

  const deliveryLocation =
    tracking?.latitude &&
    tracking?.longitude
      ? {
          latitude: tracking.latitude,
          longitude: tracking.longitude,
        }
      : null;

  const customerLocation =
    shipping?.latitude &&
    shipping?.longitude
      ? {
          latitude: shipping.latitude,
          longitude: shipping.longitude,
        }
      : null;

  return (
    <section style={styles.card}>
      <div style={styles.header}>
        <div>
          <p style={styles.eyebrow}>
            LIVE DELIVERY
          </p>

          <h2 style={styles.title}>
            Track Your Order
          </h2>
        </div>

        <span style={styles.status}>
          {trackingData?.orderStatus}
        </span>
      </div>

      {deliveryBoy && (
        <div style={styles.partner}>
          <div>
            <strong>
              🛵 {deliveryBoy.name}
            </strong>

            <p style={styles.smallText}>
              Your Delivery Partner
            </p>
          </div>

          {deliveryBoy.phone && (
            <a
              href={`tel:${deliveryBoy.phone}`}
              style={styles.callButton}
            >
              Call
            </a>
          )}
        </div>
      )}

      {tracking?.isActive &&
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

          <div style={styles.liveRow}>
            <span style={styles.liveDot} />

            Live location active
          </div>

          <p style={styles.smallText}>
            Last updated:{" "}
            {tracking.lastUpdatedAt
              ? new Date(
                  tracking.lastUpdatedAt
                ).toLocaleTimeString()
              : "Waiting..."}
          </p>
        </>
      ) : (
        <div style={styles.waitingBox}>
          <strong>
            Delivery tracking abhi start
            nahi hui.
          </strong>

          <p style={styles.smallText}>
            Delivery partner jab order lekar
            niklega tab live location yahan
            automatically dikhne lagegi.
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
    justifyContent: "space-between",
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
    justifyContent: "space-between",
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