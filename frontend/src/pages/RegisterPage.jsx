import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";

function RegisterPage() {
  const navigate = useNavigate();

  const { register, authLoading } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");

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

    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.password
    ) {
      setError("Name, email aur password required hain.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password minimum 6 characters ka hona chahiye.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Password aur confirm password match nahi kar rahe.");
      return;
    }

    const result = await register({
      name: formData.name.trim(),
      email: formData.email.trim(),
      password: formData.password,
    });

    if (!result.success) {
      setError(result.message);
      return;
    }

    navigate("/products", {
      replace: true,
    });
  };

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <div style={styles.brandBox}>
          <p style={styles.brandLabel}>JOIN CHILLBITE</p>

          <h1 style={styles.title}>Create Account</h1>

          <p style={styles.subtitle}>
            Register karke apne favourite treats order karo.
          </p>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            Full Name
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              autoComplete="name"
              style={styles.input}
            />
          </label>

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
              placeholder="Minimum 6 characters"
              autoComplete="new-password"
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            Confirm Password
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Enter password again"
              autoComplete="new-password"
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
            {authLoading ? "Creating account..." : "Register"}
          </button>
        </form>

        <p style={styles.bottomText}>
          Already registered?{" "}
          <Link to="/login" style={styles.link}>
            Login
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
    maxWidth: "520px",
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
    gap: "18px",
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

export default RegisterPage;