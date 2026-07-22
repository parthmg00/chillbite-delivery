import express from "express";

import {
  registerUser,
  loginUser,
  getMyProfile,
} from "../controllers/authController.js";

import {
  protect,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", protect, getMyProfile);

export default router;