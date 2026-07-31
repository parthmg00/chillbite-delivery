import { useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";
import axiosInstance from "../api/axiosInstance.js";

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    verifyOtp,
    resendOtp,
    cancelOtpVerification,
    pendingOtpEmail,
    authLoading,
    isAuthenticated,
  } = useAuth();

  const redirectPath =
    location.state?.from?.pathname || "/products";

  const [step, setStep] = useState(
    pendingOtpEmail ? "otp" : "login"
  );

  const [formData, setFormData] = useState({
    email: pendingOtpEmail || "",
    password: "",
    otp: "",
  });

  const [loginLoading, setLoginLoading] =
    useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  const loading = loginLoading || authLoading;

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectPath, {
        replace: true,
      });
    }
  }, [isAuthenticated, navigate, redirectPath]);

  useEffect(() => {
    if (pendingOtpEmail) {
      setFormData((currentData) => ({
        ...currentData,
        email: pendingOtpEmail,
      }));

      setStep("otp");
    }
  }, [pendingOtpEmail]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  };

  const handleOtpChange = (event) => {
    const onlyNumbers = event.target.value
      .replace(/\D/g, "")
      .slice(0, 6);

    setFormData((currentData) => ({
      ...currentData,
      otp: onlyNumbers,
    }));
  };

  /*
   * Step 1:
   * Email and password check karke OTP send karega.
   * Is step par JWT token generate hona zaroori nahi hai.
   */
  const handleLoginSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccessMessage("");

    const email = formData.email
      .trim()
      .toLowerCase();

    const password = formData.password;

    if (!email || !password.trim()) {
      setError(
        "Email aur password dono enter karo."
      );
      return;
    }

    try {
      setLoginLoading(true);

      const response = await axiosInstance.post(
        "/auth/login",
        {
          email,
          password,
        }
      );

      const responseData = response.data;

      console.log(
        "LOGIN API RESPONSE:",
        responseData
      );

      if (
        responseData?.success === true &&
        responseData?.requiresOtp === true
      ) {
        const otpEmail =
          responseData?.email || email;

        localStorage.setItem(
          "chillbite-otp-email",
          otpEmail
        );

        setFormData((currentData) => ({
          ...currentData,
          email: otpEmail,
          otp: "",
        }));

        setStep("otp");

        setSuccessMessage(
          responseData?.message ||
            "OTP Gmail par send kar diya gaya hai."
        );

        return;
      }

      /*
       * Optional fallback:
       * Backend direct token return kare to save kar sakte hain.
       * Current OTP flow me ye normally use nahi hoga.
       */
      if (
        responseData?.token &&
        responseData?.user
      ) {
        localStorage.setItem(
          "chillbite-token",
          responseData.token
        );

        localStorage.setItem(
          "chillbite-user",
          JSON.stringify(responseData.user)
        );

        localStorage.removeItem(
          "chillbite-otp-email"
        );

        window.location.href = redirectPath;
        return;
      }

      setError(
        responseData?.message ||
          "OTP send nahi hua. Backend response check karo."
      );
    } catch (requestError) {
      console.error(
        "Login request error:",
        requestError
      );

      setError(
        requestError.response?.data?.message ||
          "Login failed. Please try again."
      );
    } finally {
      setLoginLoading(false);
    }
  };

  /*
   * Step 2:
   * Gmail par received OTP verify karega.
   * Successful verification ke baad token generate hoga.
   */
  const handleOtpSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccessMessage("");

    const email = formData.email
      .trim()
      .toLowerCase();

    const otp = formData.otp.trim();

    if (!email) {
      setError(
        "OTP verify karne ke liye email missing hai."
      );
      return;
    }

    if (otp.length !== 6) {
      setError(
        "Complete 6-digit OTP enter karo."
      );
      return;
    }

    const result = await verifyOtp({
      email,
      otp,
    });

    console.log(
      "VERIFY OTP RESULT:",
      result
    );

    if (!result?.success) {
      setError(
        result?.message ||
          "OTP verification failed."
      );
      return;
    }

    localStorage.removeItem(
      "chillbite-otp-email"
    );

    setSuccessMessage(
      result?.message ||
        "OTP verified. Login successful."
    );

    navigate(redirectPath, {
      replace: true,
    });
  };

  const handleResendOtp = async () => {
    setError("");
    setSuccessMessage("");

    const email = formData.email
      .trim()
      .toLowerCase();

    if (!email) {
      setError("Email address missing hai.");
      return;
    }

    const result = await resendOtp(email);

    if (!result?.success) {
      setError(
        result?.message ||
          "OTP resend nahi hua."
      );
      return;
    }

    setFormData((currentData) => ({
      ...currentData,
      otp: "",
    }));

    localStorage.setItem(
      "chillbite-otp-email",
      email
    );

    setSuccessMessage(
      result?.message ||
        "Naya OTP Gmail par send kar diya gaya hai."
    );
  };

  const handleChangeLoginDetails = () => {
    cancelOtpVerification();

    localStorage.removeItem(
      "chillbite-otp-email"
    );

    setStep("login");

    setFormData({
      email: formData.email,
      password: "",
      otp: "",
    });

    setError("");
    setSuccessMessage("");
  };

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <div style={styles.brandBox}>
          <p style={styles.brandLabel}>
            {step === "login"
              ? "WELCOME BACK"
              : "EMAIL VERIFICATION"}
          </p>

          <h1 style={styles.title}>
            {step === "login"
              ? "Login to ChillBite"
              : "Verify your OTP"}
          </h1>

          {step === "login" ? (
            <p style={styles.subtitle}>
              Email aur password enter karo.
              Customer ke Gmail par verification
              OTP bheja jayega.
            </p>
          ) : (
            <>
              <p style={styles.subtitle}>
                Humne 6-digit OTP is Gmail
                address par send kiya hai:
              </p>

              <p style={styles.emailText}>
                {formData.email}
              </p>
            </>
          )}
        </div>

        {error && (
          <div style={styles.errorBox}>
            {error}
          </div>
        )}

        {successMessage && (
          <div style={styles.successBox}>
            {successMessage}
          </div>
        )}

        {step === "login" ? (
          <form
            onSubmit={handleLoginSubmit}
            style={styles.form}
          >
            <label style={styles.label}>
              Email Address

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="example@gmail.com"
                autoComplete="email"
                required
                disabled={loading}
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
                required
                disabled={loading}
                style={styles.input}
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.submitButton,
                opacity: loading ? 0.7 : 1,
                cursor: loading
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              {loginLoading
                ? "Sending OTP..."
                : "Login & Send OTP"}
            </button>
          </form>
        ) : (
          <form
            onSubmit={handleOtpSubmit}
            style={styles.form}
          >
            <label style={styles.label}>
              Enter 6-Digit OTP

              <input
                type="text"
                name="otp"
                value={formData.otp}
                onChange={handleOtpChange}
                placeholder="000000"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                required
                autoFocus
                disabled={loading}
                style={styles.otpInput}
              />
            </label>

            <button
              type="submit"
              disabled={
                loading ||
                formData.otp.length !== 6
              }
              style={{
                ...styles.submitButton,
                opacity:
                  loading ||
                  formData.otp.length !== 6
                    ? 0.7
                    : 1,
                cursor:
                  loading ||
                  formData.otp.length !== 6
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {authLoading
                ? "Verifying OTP..."
                : "Verify OTP & Login"}
            </button>

            <div style={styles.actionBox}>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading}
                style={{
                  ...styles.textButton,
                  opacity: loading ? 0.6 : 1,
                  cursor: loading
                    ? "not-allowed"
                    : "pointer",
                }}
              >
                Resend OTP
              </button>

              <button
                type="button"
                onClick={
                  handleChangeLoginDetails
                }
                disabled={loading}
                style={{
                  ...styles.textButton,
                  opacity: loading ? 0.6 : 1,
                  cursor: loading
                    ? "not-allowed"
                    : "pointer",
                }}
              >
                Change email or password
              </button>
            </div>
          </form>
        )}

        {step === "login" && (
          <p style={styles.bottomText}>
            Account nahi hai?{" "}
            <Link
              to="/register"
              style={styles.link}
            >
              Create account
            </Link>
          </p>
        )}
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
    boxSizing: "border-box",
    background: "#ffffff",
    borderRadius: "24px",
    boxShadow:
      "0 18px 50px rgba(31, 41, 55, 0.12)",
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

  emailText: {
    margin: "10px 0 0",
    color: "#1f2937",
    fontWeight: "800",
    wordBreak: "break-word",
  },

  errorBox: {
    marginBottom: "20px",
    padding: "12px 14px",
    border: "1px solid #fecaca",
    borderRadius: "10px",
    background: "#fef2f2",
    color: "#dc2626",
    fontSize: "14px",
    lineHeight: "1.5",
  },

  successBox: {
    marginBottom: "20px",
    padding: "12px 14px",
    border: "1px solid #bbf7d0",
    borderRadius: "10px",
    background: "#f0fdf4",
    color: "#15803d",
    fontSize: "14px",
    lineHeight: "1.5",
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
    background: "#ffffff",
  },

  otpInput: {
    width: "100%",
    boxSizing: "border-box",
    padding: "15px",
    border: "2px solid #ffb4b5",
    borderRadius: "11px",
    outline: "none",
    fontSize: "27px",
    fontWeight: "800",
    letterSpacing: "10px",
    textAlign: "center",
    background: "#fffafa",
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

  actionBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
  },

  textButton: {
    padding: 0,
    border: "none",
    background: "transparent",
    color: "#ff4d4f",
    fontSize: "14px",
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