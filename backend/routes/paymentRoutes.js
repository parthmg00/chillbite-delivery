import express from "express";

import {
  createRazorpayOrder,
  verifyOrderPayment,
  verifyWalletPayment,
} from "../controllers/paymentController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.post("/create-order", createRazorpayOrder);
router.post("/verify", verifyOrderPayment);
router.post("/verify-wallet", verifyWalletPayment);

export default router;