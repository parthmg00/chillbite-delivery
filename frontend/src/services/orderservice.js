import axiosInstance from "../api/axiosInstance";

const getAuthToken = () => {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken") ||
    ""
  );
};

const getAuthConfig = () => {
  const token = getAuthToken();

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export const createOrder = async (orderData) => {
  try {
    const response = await axiosInstance.post(
      "/orders",
      orderData,
      getAuthConfig()
    );

    return response.data;
  } catch (error) {
    throw (
      error.response?.data || {
        success: false,
        message: "Unable to place order.",
      }
    );
  }
};

export const getMyOrders = async () => {
  try {
    const response = await axiosInstance.get(
      "/orders/my-orders",
      getAuthConfig()
    );

    return response.data;
  } catch (error) {
    throw (
      error.response?.data || {
        success: false,
        message: "Unable to fetch orders.",
      }
    );
  }
};

export const getOrderById = async (orderId) => {
  try {
    const response = await axiosInstance.get(
      `/orders/${orderId}`,
      getAuthConfig()
    );

    return response.data;
  } catch (error) {
    throw (
      error.response?.data || {
        success: false,
        message: "Unable to fetch order.",
      }
    );
  }
};

export const cancelOrder = async (
  orderId,
  reason = "Cancelled by customer."
) => {
  try {
    const response = await axiosInstance.patch(
      `/orders/${orderId}/cancel`,
      { reason },
      getAuthConfig()
    );

    return response.data;
  } catch (error) {
    throw (
      error.response?.data || {
        success: false,
        message: "Unable to cancel order.",
      }
    );
  }
};