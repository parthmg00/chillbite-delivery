import { useState } from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

function LoginPage() {
  const navigate = useNavigate();

  const {
    login,
    loading,
  } = useAuth();

  const [formData, setFormData] =
    useState({
      email: "",
      password: "",
    });

  const [error, setError] = useState("");

  const [message, setMessage] =
    useState("");

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setError("");
      setMessage("");

      const response = await login(
        formData.email,
        formData.password
      );

      setMessage(
        response.message ||
          "Login successful"
      );

      if (
        response.user?.role === "admin"
      ) {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (error) {
      console.error(
        "Login error:",
        error
      );

      setError(
        error.response?.data?.message ||
          error.message ||
          "Login failed"
      );
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-heading">
          <p>WELCOME BACK</p>

          <h1>Login to ChillBite</h1>

          <span>
            Apna account access karne ke
            liye login karo.
          </span>
        </div>

        {error && (
          <p className="auth-error">
            {error}
          </p>
        )}

        {message && (
          <p className="auth-success">
            {message}
          </p>
        )}

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >
          <div className="form-group">
            <label htmlFor="email">
              Email address
            </label>

            <input
              id="email"
              name="email"
              type="email"
              placeholder="parth3@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              Password
            </label>

            <input
              id="password"
              name="password"
              type="password"
              placeholder="Enter password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading
              ? "Logging in..."
              : "Login"}
          </button>
        </form>

        <p className="auth-bottom-text">
          Account nahi hai?{" "}

          <Link to="/register">
            Register here
          </Link>
        </p>
      </section>
    </main>
  );
}

export default LoginPage;