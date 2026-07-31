import express from "express";

import {
  registerUser,
  loginUser,
  verifyLoginOtp,
  resendLoginOtp,
  getMyProfile,
} from "../controllers/authController.js";

import {
  protect,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);

router.post("/login", loginUser);

router.post("/verify-otp", verifyLoginOtp);

router.post("/resend-otp", resendLoginOtp);

router.get("/me", protect, getMyProfile);

export default router;