import Razorpay from "razorpay";
import crypto from "crypto";
import Order from "../models/Order.js";
import User from "../models/User.js";
import WalletTransaction from "../models/WalletTransaction.js";

// Razorpay instance ko function ke andar banate hain (lazy) —
// taaki .env values load ho chuki ho jab isse use kiya jaye
function getRazorpayInstance() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

/*
|--------------------------------------------------------------------------
| CREATE RAZORPAY ORDER (checkout aur wallet, dono ke liye)
|--------------------------------------------------------------------------
*/

export const createRazorpayOrder = async (req, res) => {
  try {
    const { amount, receipt } = req.body;

    const safeAmount = Number(amount);

    if (!Number.isFinite(safeAmount) || safeAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid amount enter karo.",
      });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({
        success: false,
        message:
          "Razorpay keys server pe configure nahi hain. .env file check karo.",
      });
    }

    const razorpay = getRazorpayInstance();

    const options = {
      amount: Math.round(safeAmount * 100),
      currency: "INR",
      receipt: receipt || `receipt_${Date.now()}`,
    };

    const razorpayOrder = await razorpay.orders.create(options);

    return res.status(200).json({
      success: true,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Razorpay order create error:", error);

    return res.status(500).json({
      success: false,
      message: "Payment order create nahi hua.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| VERIFY ORDER PAYMENT (checkout ke liye)
|--------------------------------------------------------------------------
*/

export const verifyOrderPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = req.body;

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification fail ho gayi.",
      });
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        paymentStatus: "Paid",
        paymentId: razorpay_payment_id,
        paidAt: new Date(),
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Payment successful!",
      order,
    });
  } catch (error) {
    console.error("Order payment verify error:", error);

    return res.status(500).json({
      success: false,
      message: "Payment verify nahi hui.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| VERIFY WALLET PAYMENT (Add Money ke liye)
|--------------------------------------------------------------------------
*/

export const verifyWalletPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount,
    } = req.body;

    const safeAmount = Number(amount);

    if (!Number.isFinite(safeAmount) || safeAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount.",
      });
    }

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification fail ho gayi.",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $inc: { walletBalance: safeAmount } },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const transaction = await WalletTransaction.create({
      user: req.user._id,
      amount: safeAmount,
      type: "credit",
      reason: "Money added via Razorpay",
      status: "completed",
      balanceAfterTransaction: Number(updatedUser.walletBalance || 0),
      paymentMethod: "razorpay",
      paymentId: razorpay_payment_id,
    });

    return res.status(200).json({
      success: true,
      message: `₹${safeAmount.toFixed(2)} wallet me add ho gaya.`,
      walletBalance: Number(updatedUser.walletBalance || 0),
      balance: Number(updatedUser.walletBalance || 0),
      transaction,
    });
  } catch (error) {
    console.error("Wallet payment verify error:", error);

    return res.status(500).json({
      success: false,
      message: "Wallet payment verify nahi hui.",
    });
  }
};