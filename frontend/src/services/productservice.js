import axiosInstance from "../api/axiosInstance";

export const getAllProducts = async () => {
  const response = await axiosInstance.get("/products");
  return response.data;
};

export const getSingleProduct = async (identifier) => {
  const response = await axiosInstance.get(`/products/${identifier}`);
  return response.data;
};

export const createProduct = async (productData) => {
  const response = await axiosInstance.post("/products", productData);
  return response.data;
};

export const updateProduct = async (identifier, productData) => {
  const response = await axiosInstance.patch(
    `/products/${identifier}`,
    productData
  );

  return response.data;
};

export const deleteProduct = async (identifier) => {
  const response = await axiosInstance.delete(`/products/${identifier}`);
  return response.data;
};