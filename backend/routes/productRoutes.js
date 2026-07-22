import express from "express";

import {
  createProduct,
  deleteProduct,
  getAllProducts,
  getSingleProduct,
  updateProduct,
} from "../controllers/productController.js";

import {
  protect,
  adminOnly,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getAllProducts);

router.post("/", protect, adminOnly, createProduct);

router.get("/:identifier", getSingleProduct);

router.patch(
  "/:identifier",
  protect,
  adminOnly,
  updateProduct,
);

router.delete(
  "/:identifier",
  protect,
  adminOnly,
  deleteProduct,
);

export default router;