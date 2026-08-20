import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { getSocket } from "../utils/socket";
import { toast } from "react-toastify";

export default function DeliveryTracking() {
  const { orderId } = useParams();
  const [isTracking, setIsTracking] = useState(false);
  const socketRef = useRef(null);
  const watchIdRef = useRef(null);

  useEffect(() => {
    socketRef.current = getSocket();

    socketRef.current.on("tracking:error", (err) => {
      toast.error(err.message);
    });

    socketRef.current.on("delivery:started", () => {
      toast.success("Delivery shuru ho gayi!");
    });

    return () => {
      socketRef.current.off("tracking:error");
      socketRef.current.off("delivery:started");
    };
  }, []);

  const startDelivery = () => {
    socketRef.current.emit("delivery:start", { orderId });

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy, speed, heading } =
          position.coords;

        socketRef.current.emit("delivery:location", {
          orderId,
          latitude,
          longitude,
          accuracy,
          speed,
          heading,
        });
      },
      (error) => {
        toast.error("GPS location nahi mil rahi: " + error.message);
      },
      { enableHighAccuracy: true, maximumAge: 5000 }
    );

    setIsTracking(true);
  };

  const stopDelivery = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    socketRef.current.emit("delivery:stop", { orderId });
    setIsTracking(false);
  };

  const markDelivered = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    socketRef.current.emit("delivery:delivered", { orderId });
    setIsTracking(false);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Order: {orderId}</h2>

      {!isTracking ? (
        <button onClick={startDelivery}>Start Delivery</button>
      ) : (
        <>
          <p>📍 Location bheji ja rahi hai...</p>
          <button onClick={stopDelivery}>Stop</button>
          <button onClick={markDelivered}>Mark Delivered</button>
        </>
      )}
    </div>
  );
}