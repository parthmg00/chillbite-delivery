import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer
      style={{
        background: "#111827",
        color: "#ffffff",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "45px 20px 25px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "35px",
        }}
      >
        <div>
          <h2
            style={{
              color: "#ff4d4f",
              marginTop: 0,
              marginBottom: "12px",
            }}
          >
            ChillBite
          </h2>

          <p
            style={{
              color: "#d1d5db",
              lineHeight: "1.7",
              margin: 0,
            }}
          >
            Ice creams, waffles, cakes and cold drinks delivered directly to
            your doorstep.
          </p>
        </div>

        <div>
          <h3 style={{ marginTop: 0 }}>Quick Links</h3>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <Link to="/" style={footerLinkStyle}>
              Home
            </Link>

            <Link to="/products" style={footerLinkStyle}>
              Products
            </Link>

            <Link to="/cart" style={footerLinkStyle}>
              Cart
            </Link>

            <Link to="/login" style={footerLinkStyle}>
              Login
            </Link>
          </div>
        </div>

        <div>
          <h3 style={{ marginTop: 0 }}>Contact</h3>

          <p style={contactStyle}>Email: support@chillbite.com</p>
          <p style={contactStyle}>Phone: +91 98765 43210</p>
          <p style={contactStyle}>Delivery: 10 AM to 11 PM</p>
        </div>
      </div>

      <div
        style={{
          borderTop: "1px solid #374151",
          textAlign: "center",
          padding: "18px 20px",
          color: "#9ca3af",
        }}
      >
        © 2026 ChillBite. All rights reserved.
      </div>
    </footer>
  );
}

const footerLinkStyle = {
  color: "#d1d5db",
  textDecoration: "none",
};

const contactStyle = {
  color: "#d1d5db",
  margin: "8px 0",
};

export default Footer;