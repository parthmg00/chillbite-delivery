import { useEffect, useRef } from "react";
import L from "leaflet";

import "leaflet/dist/leaflet.css";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

/*
 * Leaflet default marker icons ko Vite ke saath
 * correctly load karne ke liye.
 */
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function LiveTrackingMap({
  deliveryLocation,
  customerLocation,
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  const deliveryMarkerRef = useRef(null);
  const customerMarkerRef = useRef(null);

  /*
   * Map sirf ek baar create hoga.
   */
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return;
    }

    /*
     * Priority:
     * 1. Delivery boy location
     * 2. Customer delivery location
     * 3. Default Mumbai location
     */
    const initialLatitude =
      deliveryLocation?.latitude ??
      customerLocation?.latitude ??
      19.076;

    const initialLongitude =
      deliveryLocation?.longitude ??
      customerLocation?.longitude ??
      72.8777;

    const map = L.map(
      mapContainerRef.current
    ).setView(
      [
        Number(initialLatitude),
        Number(initialLongitude),
      ],
      15
    );

    /*
     * OpenStreetMap tiles
     */
    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 19,

        attribution:
          "&copy; OpenStreetMap contributors",
      }
    ).addTo(map);

    mapRef.current = map;

    /*
     * Component remove hone par map cleanup.
     */
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      deliveryMarkerRef.current = null;
      customerMarkerRef.current = null;
    };
  }, []);

  /*
   * DELIVERY BOY MARKER
   *
   * Backend se location change hone par
   * marker automatically move hoga.
   */
  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    if (
      deliveryLocation?.latitude == null ||
      deliveryLocation?.longitude == null
    ) {
      return;
    }

    const latitude = Number(
      deliveryLocation.latitude
    );

    const longitude = Number(
      deliveryLocation.longitude
    );

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      return;
    }

    const position = [
      latitude,
      longitude,
    ];

    if (!deliveryMarkerRef.current) {
      deliveryMarkerRef.current = L.marker(
        position
      )
        .addTo(mapRef.current)
        .bindPopup(
          "<strong>🛵 Delivery Partner</strong><br/>Live Location"
        );
    } else {
      deliveryMarkerRef.current.setLatLng(
        position
      );
    }

    /*
     * Delivery boy move kare to map
     * uske marker ki taraf smoothly move hoga.
     */
    mapRef.current.panTo(position, {
      animate: true,
      duration: 1,
    });
  }, [
    deliveryLocation?.latitude,
    deliveryLocation?.longitude,
  ]);

  /*
   * CUSTOMER / DELIVERY ADDRESS MARKER
   */
  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    if (
      customerLocation?.latitude == null ||
      customerLocation?.longitude == null
    ) {
      return;
    }

    const latitude = Number(
      customerLocation.latitude
    );

    const longitude = Number(
      customerLocation.longitude
    );

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      return;
    }

    const position = [
      latitude,
      longitude,
    ];

    if (!customerMarkerRef.current) {
      customerMarkerRef.current =
        L.circleMarker(position, {
          radius: 10,
          weight: 4,
          fillOpacity: 0.9,
        })
          .addTo(mapRef.current)
          .bindPopup(
            "<strong>🏠 Delivery Address</strong>"
          );
    } else {
      customerMarkerRef.current.setLatLng(
        position
      );
    }
  }, [
    customerLocation?.latitude,
    customerLocation?.longitude,
  ]);

  return (
    <div style={styles.wrapper}>
      <div
        ref={mapContainerRef}
        style={styles.map}
      />

      <div style={styles.legend}>
        <div style={styles.legendItem}>
          <span>🛵</span>
          <span>Delivery Partner</span>
        </div>

        <div style={styles.legendItem}>
          <span>🏠</span>
          <span>Your Address</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    width: "100%",
  },

  map: {
    width: "100%",
    height: "420px",
    borderRadius: "18px",
    overflow: "hidden",
    zIndex: 1,
  },

  legend: {
    display: "flex",
    gap: "18px",
    flexWrap: "wrap",
    marginTop: "12px",
    padding: "10px 14px",
    background: "#f9fafb",
    borderRadius: "10px",
  },

  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    color: "#4b5563",
    fontSize: "13px",
    fontWeight: "700",
  },
};

export default LiveTrackingMap;