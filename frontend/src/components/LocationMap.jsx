import { useMemo, useState } from "react";

const DEFAULT_LOCATION = {
  latitude: 19.076,
  longitude: 72.8777,
  accuracy: null,
};

function buildAddressData(result, latitude, longitude, accuracy) {
  const address = result?.address || {};

  const roadAddress = [
    address.house_number,
    address.building,
    address.road,
    address.neighbourhood,
    address.suburb,
  ]
    .filter(Boolean)
    .join(", ");

  return {
    latitude,
    longitude,
    accuracy,
    fullAddress: result?.display_name || roadAddress || "",
    address: roadAddress || result?.display_name || "",
    city:
      address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      address.county ||
      "",
    state: address.state || address.state_district || "",
    pincode: address.postcode || "",
    country: address.country || "",
  };
}

function LocationMap({ value, onChange }) {
  const selected =
    Number.isFinite(value?.latitude) &&
    Number.isFinite(value?.longitude);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  const location = selected ? value : DEFAULT_LOCATION;

  const mapUrl = useMemo(() => {
    const latitude = Number(location.latitude);
    const longitude = Number(location.longitude);
    const delta = 0.01;

    return (
      "https://www.openstreetmap.org/export/embed.html" +
      `?bbox=${longitude - delta}%2C${latitude - delta}%2C${
        longitude + delta
      }%2C${latitude + delta}` +
      `&layer=mapnik&marker=${latitude}%2C${longitude}`
    );
  }, [location.latitude, location.longitude]);

  const reverseGeocode = async (
    latitude,
    longitude,
    accuracy
  ) => {
    setStatus("Address detect ho raha hai...");

    try {
      const url = new URL(
        "https://nominatim.openstreetmap.org/reverse"
      );

      url.searchParams.set("format", "jsonv2");
      url.searchParams.set("lat", String(latitude));
      url.searchParams.set("lon", String(longitude));
      url.searchParams.set("addressdetails", "1");
      url.searchParams.set("zoom", "18");
      url.searchParams.set("accept-language", "en");

      const response = await fetch(url.toString(), {
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Address service unavailable");
      }

      const result = await response.json();
      const locationData = buildAddressData(
        result,
        latitude,
        longitude,
        accuracy
      );

      if (typeof onChange === "function") {
        onChange(locationData);
      }

      setStatus(
        locationData.address
          ? "✓ Current location aur address auto-filled"
          : "✓ Location selected. Address manually complete karo."
      );
    } catch (requestError) {
      console.error("Reverse geocoding error:", requestError);

      if (typeof onChange === "function") {
        onChange({
          latitude,
          longitude,
          accuracy,
          fullAddress: "",
          address: "",
          city: "",
          state: "",
          pincode: "",
          country: "",
        });
      }

      setStatus("✓ Location selected. Address manually enter karo.");
    }
  };

  const getCurrentLocation = () => {
    setError("");
    setStatus("");

    if (!navigator.geolocation) {
      setError("Tumhara browser location support nahi karta.");
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const accuracy = position.coords.accuracy;

        await reverseGeocode(latitude, longitude, accuracy);
        setLoading(false);
      },
      (locationError) => {
        if (locationError.code === 1) {
          setError(
            "Location permission denied hai. Address bar ke lock icon se Location Allow karo."
          );
        } else if (locationError.code === 2) {
          setError("Current location detect nahi ho paayi.");
        } else if (locationError.code === 3) {
          setError("Location request timeout ho gayi. Dobara try karo.");
        } else {
          setError("Location fetch nahi ho paayi.");
        }

        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      }
    );
  };

  return (
    <section style={styles.wrapper}>
      <div style={styles.header}>
        <div>
          <p style={styles.eyebrow}>DELIVERY LOCATION</p>
          <h2 style={styles.title}>Current location use karo</h2>
          <p style={styles.description}>
            Location Allow karne ke baad address, city, state aur pincode
            automatically fill honge. Zarurat ho to edit bhi kar sakte ho.
          </p>
        </div>

        <button
          type="button"
          onClick={getCurrentLocation}
          disabled={loading}
          style={{
            ...styles.button,
            opacity: loading ? 0.7 : 1,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading
            ? "Detecting Location..."
            : "📍 Use My Current Location"}
        </button>
      </div>

      {error && <div style={styles.errorBox}>{error}</div>}
      {status && <div style={styles.successBox}>{status}</div>}

      <div style={styles.statusRow}>
        <span
          style={{
            ...styles.badge,
            ...(selected ? styles.selectedBadge : styles.pendingBadge),
          }}
        >
          {selected ? "✓ Location selected" : "Location not selected"}
        </span>

        {selected && (
          <span style={styles.coordinates}>
            {Number(value.latitude).toFixed(6)}, {" "}
            {Number(value.longitude).toFixed(6)}
          </span>
        )}
      </div>

      <iframe
        title="Delivery location map"
        src={mapUrl}
        style={styles.map}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />

      <p style={styles.helpText}>
        Location localhost ya HTTPS website par work karegi. Exact house/flat
        number automatic nahi milta to address field me manually add karo.
      </p>
    </section>
  );
}

const styles = {
  wrapper: {
    width: "100%",
    padding: "20px",
    boxSizing: "border-box",
    border: "1px solid #fed7d7",
    borderRadius: "16px",
    background: "#fffafa",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "18px",
    flexWrap: "wrap",
    marginBottom: "16px",
  },
  eyebrow: {
    margin: "0 0 6px",
    color: "#ff4d4f",
    fontSize: "12px",
    fontWeight: "900",
    letterSpacing: "1.2px",
  },
  title: {
    margin: "0 0 7px",
    color: "#1f2937",
    fontSize: "21px",
  },
  description: {
    maxWidth: "540px",
    margin: 0,
    color: "#6b7280",
    fontSize: "14px",
    lineHeight: "1.5",
  },
  button: {
    padding: "12px 16px",
    border: "none",
    borderRadius: "10px",
    background: "#ff4d4f",
    color: "#ffffff",
    fontWeight: "800",
  },
  errorBox: {
    marginBottom: "14px",
    padding: "12px 14px",
    border: "1px solid #fecaca",
    borderRadius: "10px",
    background: "#fef2f2",
    color: "#dc2626",
    fontSize: "14px",
  },
  successBox: {
    marginBottom: "14px",
    padding: "12px 14px",
    border: "1px solid #bbf7d0",
    borderRadius: "10px",
    background: "#f0fdf4",
    color: "#15803d",
    fontSize: "14px",
    fontWeight: "700",
  },
  statusRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "12px",
  },
  badge: {
    padding: "7px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800",
  },
  selectedBadge: {
    background: "#ecfdf5",
    color: "#047857",
  },
  pendingBadge: {
    background: "#fff7ed",
    color: "#c2410c",
  },
  coordinates: {
    color: "#6b7280",
    fontSize: "12px",
    fontWeight: "700",
  },
  map: {
    width: "100%",
    height: "350px",
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    display: "block",
  },
  helpText: {
    margin: "11px 0 0",
    color: "#6b7280",
    fontSize: "12px",
    lineHeight: "1.5",
  },
};

export default LocationMap;