import express from "express";

import {
  cancelOrder,
  createOrder,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
} from "../controllers/orderController.js";

import {
  adminOnly,
  protect,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createOrder);

router.get("/my-orders", protect, getMyOrders);

router.get("/:id", protect, getOrderById);

router.put("/:id/cancel", protect, cancelOrder);

router.put(
  "/:id/status",
  protect,
  adminOnly,
  updateOrderStatus
);

export default router;