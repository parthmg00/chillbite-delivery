import { useState } from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

function RegisterPage() {
  const navigate = useNavigate();

  const {
    register,
    loading,
  } = useAuth();

  const [formData, setFormData] =
    useState({
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    });

  const [error, setError] = useState("");

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

      if (
        formData.password !==
        formData.confirmPassword
      ) {
        setError(
          "Password aur confirm password same hone chahiye"
        );

        return;
      }

      await register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });

      navigate("/");
    } catch (error) {
      console.error(
        "Register error:",
        error
      );

      setError(
        error.response?.data?.message ||
          error.message ||
          "Registration failed"
      );
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-heading">
          <p>CREATE ACCOUNT</p>

          <h1>Join ChillBite</h1>

          <span>
            Apna account banao aur favourite
            food order karo.
          </span>
        </div>

        {error && (
          <p className="auth-error">
            {error}
          </p>
        )}

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >
          <div className="form-group">
            <label htmlFor="name">
              Full name
            </label>

            <input
              id="name"
              name="name"
              type="text"
              placeholder="Parth Gandhi"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">
              Email address
            </label>

            <input
              id="email"
              name="email"
              type="email"
              placeholder="parth@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">
              Phone number
            </label>

            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder="9876543210"
              value={formData.phone}
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
              placeholder="Minimum 6 characters"
              value={formData.password}
              onChange={handleChange}
              minLength="6"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">
              Confirm password
            </label>

            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Enter password again"
              value={
                formData.confirmPassword
              }
              onChange={handleChange}
              minLength="6"
              required
            />
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading
              ? "Creating account..."
              : "Create Account"}
          </button>
        </form>

        <p className="auth-bottom-text">
          Already registered?{" "}

          <Link to="/login">
            Login here
          </Link>
        </p>
      </section>
    </main>
  );
}

export default RegisterPage;