import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { getSocket } from "../utils/socket";
import { toast } from "react-toastify";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Leaflet ka default marker icon fix (warna icon nahi dikhta)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

export default function CustomerTracking() {
  const { orderId } = useParams();
  const socketRef = useRef(null);

  const [location, setLocation] = useState(null); // { latitude, longitude }
  const [orderStatus, setOrderStatus] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    socketRef.current = getSocket();

    // Server ko batao ki hum ye order track karna chahte hain
    socketRef.current.emit("tracking:join", { orderId });

    // Jab room join hota hai, current status milta hai
    socketRef.current.on("tracking:state", (data) => {
      setOrderStatus(data.orderStatus);

      if (data.tracking?.latitude && data.tracking?.longitude) {
        setLocation({
          latitude: data.tracking.latitude,
          longitude: data.tracking.longitude,
        });
      }

      setLoading(false);
    });

    // Live location update
    socketRef.current.on("delivery:location", (data) => {
      setLocation({
        latitude: data.latitude,
        longitude: data.longitude,
      });
    });

    socketRef.current.on("delivery:started", (data) => {
      setOrderStatus(data.orderStatus);
      toast.info("Delivery shuru ho gayi hai!");
    });

    socketRef.current.on("delivery:delivered", (data) => {
      setOrderStatus(data.orderStatus);
      toast.success("Order deliver ho gaya!");
    });

    socketRef.current.on("tracking:error", (err) => {
      toast.error(err.message);
      setLoading(false);
    });

    return () => {
      socketRef.current.off("tracking:state");
      socketRef.current.off("delivery:location");
      socketRef.current.off("delivery:started");
      socketRef.current.off("delivery:delivered");
      socketRef.current.off("tracking:error");
    };
  }, [orderId]);

  if (loading) {
    return <p style={{ padding: "20px" }}>Location load ho rahi hai...</p>;
  }

  if (!location) {
    return (
      <p style={{ padding: "20px" }}>
        Abhi delivery boy ne tracking start nahi ki hai.
      </p>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>Order Status: {orderStatus}</h2>

      <MapContainer
        center={[location.latitude, location.longitude]}
        zoom={15}
        style={{ height: "500px", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />

        <Marker position={[location.latitude, location.longitude]}>
          <Popup>Delivery boy yahan hai</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}