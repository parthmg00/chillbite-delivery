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

  const updateUser = useCallback((updatedValues) => {
    setUser((currentUser) => {
      if (!currentUser) {
        return currentUser;
      }

      return {
        ...currentUser,
        ...updatedValues,
      };
    });
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!token) {
      return {
        success: false,
        message: "User logged in nahi hai.",
      };
    }

    try {
      const response = await axiosInstance.get("/auth/profile");

      const responseData = response.data;

      const refreshedUser =
        responseData?.user ||
        responseData?.data?.user ||
        responseData?.data ||
        null;

      if (refreshedUser) {
        setUser(refreshedUser);
      }

      return {
        success: true,
        user: refreshedUser,
        data: responseData,
      };
    } catch (error) {
      console.error("Profile refresh error:", error);

      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Profile refresh nahi hua.",
      };
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

      if (!receivedToken) {
        return {
          success: false,
          message: "Registration response me token nahi mila.",
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

  const logout = useCallback(() => {
    setUser(null);
    setToken("");

    localStorage.removeItem("chillbite-user");
    localStorage.removeItem("chillbite-token");
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      authLoading,
      isAuthenticated: Boolean(token),
      register,
      login,
      logout,
      updateUser,
      refreshProfile,
    }),
    [
      user,
      token,
      authLoading,
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
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}