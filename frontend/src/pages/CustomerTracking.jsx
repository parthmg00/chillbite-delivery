import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import { getSocket } from "../utils/socket";
import { PICKUP_LOCATION } from "../utils/constants";
import { toast } from "react-toastify";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default marker icon (warna icon nahi dikhta)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

// Alag-alag colored icons banane ka helper
const createIcon = (color) =>
  new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl:
      "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

const pickupIcon = createIcon("green"); // pickup = green
const deliveryIcon = createIcon("red"); // customer address = red
const riderIcon = createIcon("blue"); // delivery boy = blue

export default function CustomerTracking() {
  const { orderId } = useParams();
  const socketRef = useRef(null);

  const [riderLocation, setRiderLocation] = useState(null); // delivery boy ki live location
  const [deliveryPoint, setDeliveryPoint] = useState(null); // customer ka address
  const [orderStatus, setOrderStatus] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    socketRef.current = getSocket();

    socketRef.current.emit("tracking:join", { orderId });

    socketRef.current.on("tracking:state", (data) => {
      setOrderStatus(data.orderStatus);

      // Customer ka delivery address (yeh fixed rehta hai)
      if (
        data.shippingAddress?.latitude &&
        data.shippingAddress?.longitude
      ) {
        setDeliveryPoint({
          latitude: data.shippingAddress.latitude,
          longitude: data.shippingAddress.longitude,
        });
      }

      // Agar delivery boy already location bhej chuka hai
      if (data.tracking?.latitude && data.tracking?.longitude) {
        setRiderLocation({
          latitude: data.tracking.latitude,
          longitude: data.tracking.longitude,
        });
      }

      setLoading(false);
    });

    // Live location update
    socketRef.current.on("delivery:location", (data) => {
      setRiderLocation({
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

  if (!deliveryPoint) {
    return (
      <p style={{ padding: "20px" }}>
        Delivery address nahi mila is order ke liye.
      </p>
    );
  }

  // Map ka center — agar rider ki location hai to wahi, warna pickup point
  const mapCenter = riderLocation
    ? [riderLocation.latitude, riderLocation.longitude]
    : [PICKUP_LOCATION.latitude, PICKUP_LOCATION.longitude];

  // Route line ke points (pickup -> rider -> delivery, ya sirf pickup -> delivery)
  const routePoints = riderLocation
    ? [
        [PICKUP_LOCATION.latitude, PICKUP_LOCATION.longitude],
        [riderLocation.latitude, riderLocation.longitude],
        [deliveryPoint.latitude, deliveryPoint.longitude],
      ]
    : [
        [PICKUP_LOCATION.latitude, PICKUP_LOCATION.longitude],
        [deliveryPoint.latitude, deliveryPoint.longitude],
      ];

  return (
    <div style={{ padding: "20px" }}>
      <h2>Order Status: {orderStatus}</h2>

      <MapContainer
        center={mapCenter}
        zoom={13}
        style={{ height: "500px", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />

        {/* Pickup point - Shop */}
        <Marker
          position={[PICKUP_LOCATION.latitude, PICKUP_LOCATION.longitude]}
          icon={pickupIcon}
        >
          <Popup>📍 Pickup: {PICKUP_LOCATION.name}</Popup>
        </Marker>

        {/* Delivery point - Customer address */}
        <Marker
          position={[deliveryPoint.latitude, deliveryPoint.longitude]}
          icon={deliveryIcon}
        >
          <Popup>🏠 Delivery Address</Popup>
        </Marker>

        {/* Live rider location - sirf tab dikhega jab delivery boy ne start kiya ho */}
        {riderLocation && (
          <Marker
            position={[riderLocation.latitude, riderLocation.longitude]}
            icon={riderIcon}
          >
            <Popup>🛵 Delivery Boy yahan hai</Popup>
          </Marker>
        )}

        {/* Route line */}
        <Polyline positions={routePoints} color="blue" dashArray="6" />
      </MapContainer>
    </div>
  );
}