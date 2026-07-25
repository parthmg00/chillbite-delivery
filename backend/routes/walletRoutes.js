import express from "express";

import {
  addMoney,
  getWallet,
  getWalletTransactionById,
} from "../controllers/walletController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/", getWallet);

router.post("/add-money", addMoney);

router.get(
  "/transactions/:id",
  getWalletTransactionById
);

export default router;