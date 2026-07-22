import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { login, authLoading } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  const redirectPath = location.state?.from?.pathname || "/products";

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!formData.email.trim() || !formData.password.trim()) {
      setError("Email aur password dono enter karo.");
      return;
    }

    const result = await login({
      email: formData.email.trim(),
      password: formData.password,
    });

    if (!result.success) {
      setError(result.message);
      return;
    }

    navigate(redirectPath, {
      replace: true,
    });
  };

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <div style={styles.brandBox}>
          <p style={styles.brandLabel}>WELCOME BACK</p>

          <h1 style={styles.title}>Login to ChillBite</h1>

          <p style={styles.subtitle}>
            Apne account me login karke cart aur orders manage karo.
          </p>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            Email Address
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="example@gmail.com"
              autoComplete="email"
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            Password
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              autoComplete="current-password"
              style={styles.input}
            />
          </label>

          <button
            type="submit"
            disabled={authLoading}
            style={{
              ...styles.submitButton,
              opacity: authLoading ? 0.7 : 1,
              cursor: authLoading ? "not-allowed" : "pointer",
            }}
          >
            {authLoading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p style={styles.bottomText}>
          Account nahi hai?{" "}
          <Link to="/register" style={styles.link}>
            Create account
          </Link>
        </p>
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "80vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "50px 20px",
    background:
      "linear-gradient(135deg, #fff6f3 0%, #ffe7df 50%, #fffaf8 100%)",
    fontFamily: "Arial, sans-serif",
  },

  card: {
    width: "100%",
    maxWidth: "480px",
    padding: "42px",
    background: "#ffffff",
    borderRadius: "24px",
    boxShadow: "0 18px 50px rgba(31, 41, 55, 0.12)",
  },

  brandBox: {
    textAlign: "center",
    marginBottom: "28px",
  },

  brandLabel: {
    margin: "0 0 8px",
    color: "#ff4d4f",
    fontWeight: "800",
    fontSize: "13px",
    letterSpacing: "1.5px",
  },

  title: {
    margin: "0 0 10px",
    color: "#1f2937",
    fontSize: "34px",
  },

  subtitle: {
    margin: 0,
    color: "#6b7280",
    lineHeight: "1.6",
  },

  errorBox: {
    marginBottom: "20px",
    padding: "12px 14px",
    border: "1px solid #fecaca",
    borderRadius: "10px",
    background: "#fef2f2",
    color: "#dc2626",
    fontSize: "14px",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },

  label: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    color: "#374151",
    fontWeight: "700",
    fontSize: "14px",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "14px 15px",
    border: "1px solid #d1d5db",
    borderRadius: "11px",
    outline: "none",
    fontSize: "15px",
  },

  submitButton: {
    width: "100%",
    padding: "14px",
    border: "none",
    borderRadius: "11px",
    background: "#ff4d4f",
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: "800",
  },

  bottomText: {
    margin: "24px 0 0",
    color: "#6b7280",
    textAlign: "center",
  },

  link: {
    color: "#ff4d4f",
    textDecoration: "none",
    fontWeight: "800",
  },
};

export default LoginPage;