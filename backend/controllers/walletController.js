import mongoose from "mongoose";

import User from "../models/User.js";
import WalletTransaction from "../models/WalletTransaction.js";

const SUPPORTED_PAYMENT_METHODS = [
  "gpay",
  "phonepe",
  "upi",
  "card",
];

function normalizePaymentMethod(method) {
  return String(method || "")
    .trim()
    .toLowerCase();
}

function generatePaymentId(method) {
  const prefix =
    method === "gpay"
      ? "GPAY"
      : method === "phonepe"
        ? "PHONEPE"
        : method === "upi"
          ? "UPI"
          : "CARD";

  return `${prefix}_${Date.now()}_${Math.floor(
    100000 + Math.random() * 900000
  )}`;
}

function formatUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    walletBalance: Number(user.walletBalance || 0),
  };
}

/*
|--------------------------------------------------------------------------
| GET WALLET
|--------------------------------------------------------------------------
| Route: GET /api/wallet
|--------------------------------------------------------------------------
*/

export const getWallet = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "-password"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const transactions = await WalletTransaction.find({
      user: req.user._id,
    })
      .populate({
        path: "order",
        select:
          "_id totalPrice orderStatus paymentMethod paymentStatus createdAt",
      })
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      walletBalance: Number(user.walletBalance || 0),
      balance: Number(user.walletBalance || 0),
      transactions,
      user: formatUser(user),
    });
  } catch (error) {
    console.error("Get wallet error:", error);

    return res.status(500).json({
      success: false,
      message:
        error.message || "Wallet details could not be loaded.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| ADD MONEY TO WALLET
|--------------------------------------------------------------------------
| Route: POST /api/wallet/add-money
|--------------------------------------------------------------------------
|
| Demo payment methods:
| - gpay
| - phonepe
| - upi
| - card
|--------------------------------------------------------------------------
*/

export const addMoney = async (req, res) => {
  try {
    const {
      amount,
      paymentMethod,
      upiId,
      cardLastFour,
    } = req.body;

    const safeAmount = Number(amount);
    const normalizedMethod =
      normalizePaymentMethod(paymentMethod);

    if (!Number.isFinite(safeAmount)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid amount.",
      });
    }

    if (safeAmount < 10) {
      return res.status(400).json({
        success: false,
        message: "Minimum ₹10 wallet me add kar sakte ho.",
      });
    }

    if (safeAmount > 10000) {
      return res.status(400).json({
        success: false,
        message:
          "Maximum ₹10,000 ek transaction me add kar sakte ho.",
      });
    }

    if (
      !SUPPORTED_PAYMENT_METHODS.includes(
        normalizedMethod
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please select GPay, PhonePe, UPI or Card.",
      });
    }

    if (
      normalizedMethod === "upi" &&
      (!upiId ||
        !String(upiId)
          .trim()
          .includes("@"))
    ) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid UPI ID.",
      });
    }

    if (
      normalizedMethod === "card" &&
      cardLastFour &&
      !/^\d{4}$/.test(String(cardLastFour))
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid card details.",
      });
    }

    const paymentId =
      generatePaymentId(normalizedMethod);

    /*
    |--------------------------------------------------------------------------
    | IMPORTANT
    |--------------------------------------------------------------------------
    | This is demo payment simulation.
    | Real GPay / PhonePe / Card payment ke liye Razorpay ya
    | another payment gateway verification use karna padega.
    |--------------------------------------------------------------------------
    */

    const updatedUser =
      await User.findByIdAndUpdate(
        req.user._id,
        {
          $inc: {
            walletBalance: safeAmount,
          },
        },
        {
          new: true,
          runValidators: true,
        }
      ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User wallet not found.",
      });
    }

    try {
      const transaction =
        await WalletTransaction.create({
          user: req.user._id,
          amount: safeAmount,
          type: "credit",
          reason: `Money added via ${
            normalizedMethod === "gpay"
              ? "Google Pay"
              : normalizedMethod === "phonepe"
                ? "PhonePe"
                : normalizedMethod === "upi"
                  ? "UPI"
                  : "Card"
          }`,
          status: "completed",
          balanceAfterTransaction:
            Number(updatedUser.walletBalance || 0),

          paymentMethod: normalizedMethod,
          paymentId,

          paymentDetails: {
            upiId:
              normalizedMethod === "upi"
                ? String(upiId || "").trim()
                : "",

            cardLastFour:
              normalizedMethod === "card"
                ? String(cardLastFour || "")
                : "",
          },
        });

      return res.status(200).json({
        success: true,
        message: `₹${safeAmount.toFixed(
          2
        )} successfully wallet me add hua.`,

        walletBalance: Number(
          updatedUser.walletBalance || 0
        ),

        balance: Number(
          updatedUser.walletBalance || 0
        ),

        paymentId,
        transaction,
        user: formatUser(updatedUser),
      });
    } catch (transactionError) {
      await User.findByIdAndUpdate(
        req.user._id,
        {
          $inc: {
            walletBalance: -safeAmount,
          },
        }
      );

      throw transactionError;
    }
  } catch (error) {
    console.error("Add money error:", error);

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Wallet me money add nahi hua.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| GET SINGLE WALLET TRANSACTION
|--------------------------------------------------------------------------
| Route: GET /api/wallet/transactions/:id
|--------------------------------------------------------------------------
*/

export const getWalletTransactionById = async (
  req,
  res
) => {
  try {
    if (
      !mongoose.isValidObjectId(req.params.id)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction ID.",
      });
    }

    const transaction =
      await WalletTransaction.findOne({
        _id: req.params.id,
        user: req.user._id,
      }).populate({
        path: "order",
        select:
          "_id totalPrice orderStatus paymentMethod paymentStatus createdAt",
      });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Wallet transaction not found.",
      });
    }

    return res.status(200).json({
      success: true,
      transaction,
    });
  } catch (error) {
    console.error(
      "Get wallet transaction error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Wallet transaction could not be loaded.",
    });
  }
};