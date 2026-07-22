import mongoose from "mongoose";

import Order from "../models/Order.js";
import User from "../models/User.js";
import WalletTransaction from "../models/WalletTransaction.js";

const cancellableStatuses = [
  "Pending",
  "Confirmed",
  "Preparing",
];

function normalizePaymentMethod(paymentMethod) {
  const value = String(paymentMethod || "").trim().toLowerCase();

  if (value === "wallet") {
    return "Wallet";
  }

  if (value === "upi") {
    return "UPI";
  }

  if (value === "card") {
    return "Card";
  }

  return "Cash on Delivery";
}

export const createOrder = async (req, res) => {
  try {
    const {
      items,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      deliveryCharge,
      totalPrice,
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty.",
      });
    }

    if (
      !shippingAddress?.fullName ||
      !shippingAddress?.phone ||
      !shippingAddress?.address ||
      !shippingAddress?.city ||
      !shippingAddress?.state ||
      !shippingAddress?.pincode
    ) {
      return res.status(400).json({
        success: false,
        message: "Complete delivery address is required.",
      });
    }

    const safeItemsPrice = Number(itemsPrice);
    const safeDeliveryCharge = Number(deliveryCharge);
    const safeTotalPrice = Number(totalPrice);

    if (
      !Number.isFinite(safeItemsPrice) ||
      !Number.isFinite(safeDeliveryCharge) ||
      !Number.isFinite(safeTotalPrice) ||
      safeTotalPrice <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid order amount.",
      });
    }

    const normalizedPaymentMethod =
      normalizePaymentMethod(paymentMethod);

    let updatedUser = null;
    let walletDebited = false;

    if (normalizedPaymentMethod === "Wallet") {
      updatedUser = await User.findOneAndUpdate(
        {
          _id: req.user._id,
          walletBalance: {
            $gte: safeTotalPrice,
          },
        },
        {
          $inc: {
            walletBalance: -safeTotalPrice,
          },
        },
        {
          new: true,
        }
      ).select("-password");

      if (!updatedUser) {
        const currentUser = await User.findById(
          req.user._id
        ).select("walletBalance");

        return res.status(400).json({
          success: false,
          message: `Insufficient wallet balance. Available balance: ₹${Number(
            currentUser?.walletBalance || 0
          ).toFixed(2)}`,
        });
      }

      walletDebited = true;
    }

    try {
      const order = await Order.create({
        user: req.user._id,
        items,
        shippingAddress,
        paymentMethod: normalizedPaymentMethod,
        paymentStatus:
          normalizedPaymentMethod === "Wallet"
            ? "Paid"
            : normalizedPaymentMethod === "Cash on Delivery"
              ? "Pending"
              : "Paid",
        itemsPrice: safeItemsPrice,
        deliveryCharge: safeDeliveryCharge,
        totalPrice: safeTotalPrice,
        refundStatus: "Not Applicable",
      });

      if (normalizedPaymentMethod === "Wallet") {
        await WalletTransaction.create({
          user: req.user._id,
          order: order._id,
          amount: safeTotalPrice,
          type: "debit",
          reason: "Payment for order",
          status: "completed",
          balanceAfterTransaction:
            updatedUser.walletBalance,
        });
      }

      return res.status(201).json({
        success: true,
        message: "Order placed successfully.",
        order,
        walletBalance:
          normalizedPaymentMethod === "Wallet"
            ? updatedUser.walletBalance
            : Number(req.user.walletBalance || 0),
      });
    } catch (orderError) {
      if (walletDebited) {
        await User.findByIdAndUpdate(req.user._id, {
          $inc: {
            walletBalance: safeTotalPrice,
          },
        });
      }

      throw orderError;
    }
  } catch (error) {
    console.error("Create order error:", error);

    return res.status(500).json({
      success: false,
      message:
        error.message || "Order could not be placed.",
    });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      user: req.user._id,
    }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Get my orders error:", error);

    return res.status(500).json({
      success: false,
      message: "Orders could not be loaded.",
    });
  }
};

export const getOrderById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID.",
      });
    }

    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Get order error:", error);

    return res.status(500).json({
      success: false,
      message: "Order could not be loaded.",
    });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID.",
      });
    }

    if (!reason || !String(reason).trim()) {
      return res.status(400).json({
        success: false,
        message: "Cancellation reason is required.",
      });
    }

    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    if (order.orderStatus === "Cancelled") {
      return res.status(400).json({
        success: false,
        message: "This order is already cancelled.",
      });
    }

    if (order.orderStatus === "Delivered") {
      return res.status(400).json({
        success: false,
        message: "Delivered order cannot be cancelled.",
      });
    }

    if (!cancellableStatuses.includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled because its status is ${order.orderStatus}.`,
      });
    }

    const shouldRefundWallet =
      order.paymentMethod === "Wallet" &&
      order.paymentStatus === "Paid" &&
      order.refundStatus !== "Completed";

    let updatedUser = null;

    if (shouldRefundWallet) {
      updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        {
          $inc: {
            walletBalance: order.totalPrice,
          },
        },
        {
          new: true,
        }
      ).select("-password");

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: "User wallet was not found.",
        });
      }

      await WalletTransaction.create({
        user: req.user._id,
        order: order._id,
        amount: order.totalPrice,
        type: "credit",
        reason: "Refund for cancelled order",
        status: "completed",
        balanceAfterTransaction:
          updatedUser.walletBalance,
      });

      order.paymentStatus = "Refunded";
      order.refundStatus = "Completed";
      order.refundedAmount = order.totalPrice;
      order.refundedAt = new Date();
    } else {
      order.refundStatus = "Not Applicable";
    }

    order.orderStatus = "Cancelled";
    order.cancellation = {
      reason: String(reason).trim(),
      cancelledAt: new Date(),
      cancelledBy: "customer",
    };

    await order.save();

    return res.status(200).json({
      success: true,
      message: shouldRefundWallet
        ? "Order cancelled and amount refunded to wallet."
        : "Order cancelled successfully.",
      order,
      refundedAmount: shouldRefundWallet
        ? order.totalPrice
        : 0,
      walletBalance: updatedUser
        ? updatedUser.walletBalance
        : Number(req.user.walletBalance || 0),
    });
  } catch (error) {
    console.error("Cancel order error:", error);

    return res.status(500).json({
      success: false,
      message:
        error.message || "Order could not be cancelled.",
    });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus } = req.body;

    const allowedStatuses = [
      "Pending",
      "Confirmed",
      "Preparing",
      "Out for Delivery",
      "Delivered",
      "Cancelled",
    ];

    if (!allowedStatuses.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status.",
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    order.orderStatus = orderStatus;
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order status updated.",
      order,
    });
  } catch (error) {
    console.error("Update order status error:", error);

    return res.status(500).json({
      success: false,
      message: "Order status could not be updated.",
    });
  }
};