import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import axiosInstance from "../api/axiosInstance.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("chillbite-user");

      return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
      console.error("User read error:", error);
      return null;
    }
  });

  const [token, setToken] = useState(
    () => localStorage.getItem("chillbite-token") || ""
  );

  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem("chillbite-user", JSON.stringify(user));
    } else {
      localStorage.removeItem("chillbite-user");
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem("chillbite-token", token);
    } else {
      localStorage.removeItem("chillbite-token");
    }
  }, [token]);

  const register = async (formData) => {
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
        responseData?.data ||
        null;

      if (receivedToken) {
        setToken(receivedToken);
      }

      if (receivedUser) {
        setUser(receivedUser);
      }

      return {
        success: true,
        data: responseData,
      };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Registration failed. Please try again.",
      };
    } finally {
      setAuthLoading(false);
    }
  };

  const login = async (formData) => {
    try {
      setAuthLoading(true);

      const response = await axiosInstance.post(
        "/auth/login",
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
        responseData?.data ||
        null;

      if (!receivedToken) {
        return {
          success: false,
          message: "Login response me token nahi mila.",
        };
      }

      setToken(receivedToken);

      if (receivedUser) {
        setUser(receivedUser);
      }

      return {
        success: true,
        data: responseData,
      };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Invalid email or password.",
      };
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken("");

    localStorage.removeItem("chillbite-user");
    localStorage.removeItem("chillbite-token");
  };

  const value = useMemo(
    () => ({
      user,
      token,
      authLoading,
      isAuthenticated: Boolean(token),
      register,
      login,
      logout,
    }),
    [user, token, authLoading]
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
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}