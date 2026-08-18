import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import axiosInstance from "../api/axiosInstance.js";

const AuthContext = createContext(null);

const USER_STORAGE_KEY = "chillbite-user";
const TOKEN_STORAGE_KEY = "chillbite-token";
const OTP_EMAIL_STORAGE_KEY = "chillbite-otp-email";

function getSavedUser() {
  try {
    const savedUser = localStorage.getItem(USER_STORAGE_KEY);

    return savedUser ? JSON.parse(savedUser) : null;
  } catch (error) {
    console.error("Saved user read error:", error);

    localStorage.removeItem(USER_STORAGE_KEY);

    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getSavedUser);

  const [token, setToken] = useState(
    () => localStorage.getItem(TOKEN_STORAGE_KEY) || ""
  );

  const [pendingOtpEmail, setPendingOtpEmail] = useState(
    () => localStorage.getItem(OTP_EMAIL_STORAGE_KEY) || ""
  );

  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem(
        USER_STORAGE_KEY,
        JSON.stringify(user)
      );
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  }, [token]);

  useEffect(() => {
    if (pendingOtpEmail) {
      localStorage.setItem(
        OTP_EMAIL_STORAGE_KEY,
        pendingOtpEmail
      );
    } else {
      localStorage.removeItem(OTP_EMAIL_STORAGE_KEY);
    }
  }, [pendingOtpEmail]);

  const saveAuthenticatedUser = useCallback(
    (responseData) => {
      const receivedToken =
        responseData?.token ||
        responseData?.data?.token ||
        responseData?.accessToken ||
        "";

      const receivedUser =
        responseData?.user ||
        responseData?.data?.user ||
        null;

      if (!receivedToken) {
        return {
          success: false,
          message:
            "OTP verify hua, lekin server response me token nahi mila.",
        };
      }

      if (!receivedUser) {
        return {
          success: false,
          message:
            "Server response me customer information nahi mili.",
        };
      }

      setToken(receivedToken);
      setUser(receivedUser);
      setPendingOtpEmail("");

      return {
        success: true,
        token: receivedToken,
        user: receivedUser,
        data: responseData,
      };
    },
    []
  );

  const register = useCallback(
    async (formData) => {
      try {
        setAuthLoading(true);

        const response = await axiosInstance.post(
          "/auth/register",
          formData
        );

        const responseData = response.data;

        const receivedToken =
          responseData?.token ||
          responseData?.data?.token ||
          responseData?.accessToken ||
          "";

        const receivedUser =
          responseData?.user ||
          responseData?.data?.user ||
          null;

        /*
         * Current registration backend direct token return karta hai.
         */
        if (receivedToken) {
          setToken(receivedToken);
        }

        if (receivedUser) {
          setUser(receivedUser);
        }

        if (!receivedToken) {
          return {
            success: false,
            message:
              responseData?.message ||
              "Registration response me token nahi mila.",
          };
        }

        return {
          success: true,
          message:
            responseData?.message ||
            "Registration successful.",
          token: receivedToken,
          user: receivedUser,
          data: responseData,
        };
      } catch (error) {
        console.error("Registration error:", error);

        return {
          success: false,
          message:
            error.response?.data?.message ||
            "Registration failed. Please try again.",
        };
      } finally {
        setAuthLoading(false);
      }
    },
    []
  );

  /*
   * STEP 1
   * Email aur password verify honge.
   * Backend Gmail par OTP send karega.
   * Is response me token required nahi hai.
   */
  const login = useCallback(async (formData) => {
    try {
      setAuthLoading(true);

      const email = String(
        formData?.email || ""
      )
        .trim()
        .toLowerCase();

      const password = String(
        formData?.password || ""
      );

      if (!email || !password.trim()) {
        return {
          success: false,
          message:
            "Email aur password dono enter karo.",
        };
      }

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

      /*
       * Correct OTP login response:
       *
       * {
       *   success: true,
       *   requiresOtp: true,
       *   email: "customer@gmail.com",
       *   message: "OTP sent..."
       * }
       */
      if (responseData?.requiresOtp === true) {
        const otpEmail =
          responseData?.email ||
          responseData?.data?.email ||
          email;

        setPendingOtpEmail(otpEmail);

        return {
          success: true,
          requiresOtp: true,
          email: otpEmail,
          message:
            responseData?.message ||
            "OTP Gmail par send kar diya gaya hai.",
          data: responseData,
        };
      }

      /*
       * Fallback:
       * Backend kabhi direct token bheje to login ho jayega.
       */
      const receivedToken =
        responseData?.token ||
        responseData?.data?.token ||
        "";

      const receivedUser =
        responseData?.user ||
        responseData?.data?.user ||
        null;

      if (receivedToken && receivedUser) {
        setToken(receivedToken);
        setUser(receivedUser);
        setPendingOtpEmail("");

        return {
          success: true,
          requiresOtp: false,
          token: receivedToken,
          user: receivedUser,
          data: responseData,
        };
      }

      return {
        success: false,
        message:
          responseData?.message ||
          "Backend se OTP response nahi mila.",
      };
    } catch (error) {
      console.error("Login error:", error);

      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Invalid email or password.",
      };
    } finally {
      setAuthLoading(false);
    }
  }, []);

  /*
   * STEP 2
   * Customer ka entered OTP verify hoga.
   * Successful response me JWT token milega.
   */
  const verifyOtp = useCallback(
    async ({ email, otp }) => {
      try {
        setAuthLoading(true);

        const normalizedEmail = String(
          email || pendingOtpEmail || ""
        )
          .trim()
          .toLowerCase();

        const normalizedOtp = String(
          otp || ""
        ).trim();

        if (!normalizedEmail) {
          return {
            success: false,
            message:
              "OTP verification ke liye email missing hai.",
          };
        }

        if (!/^\d{6}$/.test(normalizedOtp)) {
          return {
            success: false,
            message:
              "Complete 6-digit OTP enter karo.",
          };
        }

        const response = await axiosInstance.post(
          "/auth/verify-otp",
          {
            email: normalizedEmail,
            otp: normalizedOtp,
          }
        );

        const responseData = response.data;

        console.log(
          "VERIFY OTP RESPONSE:",
          responseData
        );

        const authenticationResult =
          saveAuthenticatedUser(responseData);

        if (!authenticationResult.success) {
          return authenticationResult;
        }

        return {
          success: true,
          requiresOtp: false,
          message:
            responseData?.message ||
            "OTP verified. Login successful.",
          token: authenticationResult.token,
          user: authenticationResult.user,
          data: responseData,
        };
      } catch (error) {
        console.error(
          "OTP verification error:",
          error
        );

        return {
          success: false,
          message:
            error.response?.data?.message ||
            "OTP invalid ya expire ho gaya hai.",
        };
      } finally {
        setAuthLoading(false);
      }
    },
    [pendingOtpEmail, saveAuthenticatedUser]
  );

  /*
   * Customer ke Gmail par naya OTP send karega.
   */
  const resendOtp = useCallback(
    async (email) => {
      try {
        setAuthLoading(true);

        const normalizedEmail = String(
          email || pendingOtpEmail || ""
        )
          .trim()
          .toLowerCase();

        if (!normalizedEmail) {
          return {
            success: false,
            message: "Email address missing hai.",
          };
        }

        const response = await axiosInstance.post(
          "/auth/resend-otp",
          {
            email: normalizedEmail,
          }
        );

        const responseData = response.data;

        setPendingOtpEmail(normalizedEmail);

        return {
          success: true,
          email: normalizedEmail,
          message:
            responseData?.message ||
            "Naya OTP Gmail par send kar diya gaya hai.",
          data: responseData,
        };
      } catch (error) {
        console.error("Resend OTP error:", error);

        return {
          success: false,
          message:
            error.response?.data?.message ||
            "OTP resend nahi hua. Dobara try karo.",
        };
      } finally {
        setAuthLoading(false);
      }
    },
    [pendingOtpEmail]
  );

  const cancelOtpVerification =
    useCallback(() => {
      setPendingOtpEmail("");

      localStorage.removeItem(
        OTP_EMAIL_STORAGE_KEY
      );
    }, []);

  const updateUser = useCallback(
    (updatedValues) => {
      setUser((currentUser) => {
        if (!currentUser) {
          return currentUser;
        }

        return {
          ...currentUser,
          ...updatedValues,
        };
      });
    },
    []
  );

  /*
   * Logged-in customer ka latest profile fetch karega.
   * Backend route: GET /api/auth/me
   */
  const refreshProfile =
    useCallback(async () => {
      if (!token) {
        return {
          success: false,
          message: "User logged in nahi hai.",
        };
      }

      try {
        setAuthLoading(true);

        const response =
          await axiosInstance.get("/auth/me");

        const responseData = response.data;

        const refreshedUser =
          responseData?.user ||
          responseData?.data?.user ||
          responseData?.data ||
          null;

        if (!refreshedUser) {
          return {
            success: false,
            message:
              "Profile response me user information nahi mili.",
          };
        }

        setUser(refreshedUser);

        return {
          success: true,
          user: refreshedUser,
          data: responseData,
        };
      } catch (error) {
        console.error(
          "Profile refresh error:",
          error
        );

        if (
          error.response?.status === 401 ||
          error.response?.status === 403
        ) {
          setUser(null);
          setToken("");
          setPendingOtpEmail("");

          localStorage.removeItem(
            USER_STORAGE_KEY
          );

          localStorage.removeItem(
            TOKEN_STORAGE_KEY
          );

          localStorage.removeItem(
            OTP_EMAIL_STORAGE_KEY
          );
        }

        return {
          success: false,
          message:
            error.response?.data?.message ||
            "Profile refresh nahi hua.",
        };
      } finally {
        setAuthLoading(false);
      }
    }, [token]);

  const logout = useCallback(() => {
    setUser(null);
    setToken("");
    setPendingOtpEmail("");

    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(
      OTP_EMAIL_STORAGE_KEY
    );
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      pendingOtpEmail,
      authLoading,

      isAuthenticated: Boolean(token && user),
      isOtpPending: Boolean(pendingOtpEmail),

      register,
      login,
      verifyOtp,
      resendOtp,
      cancelOtpVerification,
      logout,
      updateUser,
      refreshProfile,
    }),
    [
      user,
      token,
      pendingOtpEmail,
      authLoading,
      register,
      login,
      verifyOtp,
      resendOtp,
      cancelOtpVerification,
      logout,
      updateUser,
      refreshProfile,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}