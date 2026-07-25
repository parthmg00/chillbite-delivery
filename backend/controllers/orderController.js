import mongoose from "mongoose";

import Order from "../models/Order.js";
import User from "../models/User.js";
import WalletTransaction from "../models/WalletTransaction.js";

const cancellableStatuses = [
  "Pending",
  "Confirmed",
  "Preparing",
];

/*
|--------------------------------------------------------------------------
| NUMBER HELPERS
|--------------------------------------------------------------------------
*/

function toSafeNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  /*
   * MongoDB Decimal128 support
   */
  if (
    typeof value === "object" &&
    typeof value.toString === "function"
  ) {
    const convertedObjectValue = Number(value.toString());

    if (Number.isFinite(convertedObjectValue)) {
      return convertedObjectValue;
    }
  }

  const convertedValue = Number(value);

  return Number.isFinite(convertedValue)
    ? convertedValue
    : fallback;
}

function roundMoney(value) {
  return Math.round((toSafeNumber(value) + Number.EPSILON) * 100) / 100;
}

/*
|--------------------------------------------------------------------------
| PAYMENT HELPERS
|--------------------------------------------------------------------------
*/

function normalizePaymentMethod(paymentMethod) {
  const value = String(paymentMethod || "")
    .trim()
    .toLowerCase();

  if (value === "wallet") {
    return "Wallet";
  }

  if (
    value === "upi" ||
    value === "gpay" ||
    value === "google pay" ||
    value === "phonepe" ||
    value === "phone pe"
  ) {
    return "UPI";
  }

  if (
    value === "card" ||
    value === "credit card" ||
    value === "debit card"
  ) {
    return "Card";
  }

  return "Cash on Delivery";
}

function generatePaymentId(paymentMethod) {
  const prefix =
    paymentMethod === "Wallet"
      ? "WALLET"
      : paymentMethod === "UPI"
        ? "UPI"
        : paymentMethod === "Card"
          ? "CARD"
          : "COD";

  return `${prefix}_${Date.now()}_${Math.floor(
    100000 + Math.random() * 900000
  )}`;
}

/*
|--------------------------------------------------------------------------
| ORDER AMOUNT CALCULATION
|--------------------------------------------------------------------------
*/

function calculateOrderAmounts({
  items,
  deliveryCharge,
  discountAmount,
}) {
  const calculatedItemsPrice = roundMoney(
    items.reduce((total, item) => {
      const price = toSafeNumber(item.price);
      const quantity = toSafeNumber(item.quantity, 1);

      return total + price * quantity;
    }, 0)
  );

  const safeDeliveryCharge = Math.max(
    roundMoney(deliveryCharge),
    0
  );

  const safeDiscountAmount = Math.max(
    roundMoney(discountAmount),
    0
  );

  const calculatedTotalPrice = roundMoney(
    calculatedItemsPrice +
      safeDeliveryCharge -
      safeDiscountAmount
  );

  return {
    itemsPrice: calculatedItemsPrice,
    deliveryCharge: safeDeliveryCharge,
    discountAmount: safeDiscountAmount,
    totalPrice: calculatedTotalPrice,
  };
}

/*
|--------------------------------------------------------------------------
| CREATE ORDER
|--------------------------------------------------------------------------
| POST /api/orders
|--------------------------------------------------------------------------
*/

export const createOrder = async (req, res) => {
  let debitedAmount = 0;
  let walletDebited = false;

  try {
    const {
      items,
      shippingAddress,
      paymentMethod,
      deliveryCharge = 0,
      discountAmount = 0,
      paymentId,
    } = req.body;

    /*
    |--------------------------------------------------------------------------
    | VALIDATE CART
    |--------------------------------------------------------------------------
    */

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty.",
      });
    }

    const invalidItem = items.find((item) => {
      const price = toSafeNumber(item?.price);
      const quantity = toSafeNumber(item?.quantity);

      return (
        !item?.product ||
        !item?.name ||
        price < 0 ||
        quantity <= 0
      );
    });

    if (invalidItem) {
      return res.status(400).json({
        success: false,
        message: "Cart contains an invalid product.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | VALIDATE SHIPPING ADDRESS
    |--------------------------------------------------------------------------
    */

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

    /*
    |--------------------------------------------------------------------------
    | CALCULATE AMOUNT ON BACKEND
    |--------------------------------------------------------------------------
    */

    const calculatedAmounts = calculateOrderAmounts({
      items,
      deliveryCharge,
      discountAmount,
    });

    const safeItemsPrice = calculatedAmounts.itemsPrice;
    const safeDeliveryCharge =
      calculatedAmounts.deliveryCharge;
    const safeDiscountAmount =
      calculatedAmounts.discountAmount;
    const safeTotalPrice =
      calculatedAmounts.totalPrice;

    if (
      safeItemsPrice < 0 ||
      safeDeliveryCharge < 0 ||
      safeDiscountAmount < 0 ||
      safeTotalPrice <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid order amount.",
      });
    }

    const normalizedPaymentMethod =
      normalizePaymentMethod(paymentMethod);

    /*
    |--------------------------------------------------------------------------
    | LOAD CURRENT USER
    |--------------------------------------------------------------------------
    */

    const currentUser = await User.findById(
      req.user._id
    ).select("-password");

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User account was not found.",
      });
    }

    let updatedUser = currentUser;

    /*
    |--------------------------------------------------------------------------
    | WALLET PAYMENT
    |--------------------------------------------------------------------------
    */

    if (normalizedPaymentMethod === "Wallet") {
      const currentWalletBalance = roundMoney(
        currentUser.walletBalance
      );

      if (currentWalletBalance < safeTotalPrice) {
        return res.status(400).json({
          success: false,
          message: `Insufficient wallet balance. Available balance: ₹${currentWalletBalance.toFixed(
            2
          )}`,
          walletBalance: currentWalletBalance,
          requiredAmount: safeTotalPrice,
        });
      }

      const newWalletBalance = roundMoney(
        currentWalletBalance - safeTotalPrice
      );

      /*
       * Compare current balance as well, so two simultaneous
       * orders cannot spend the same wallet balance.
       */
      updatedUser = await User.findOneAndUpdate(
        {
          _id: req.user._id,
          walletBalance: currentUser.walletBalance,
        },
        {
          $set: {
            walletBalance: newWalletBalance,
          },
        },
        {
          new: true,
          runValidators: true,
        }
      ).select("-password");

      if (!updatedUser) {
        const refreshedUser = await User.findById(
          req.user._id
        ).select("walletBalance");

        const refreshedBalance = roundMoney(
          refreshedUser?.walletBalance
        );

        return res.status(409).json({
          success: false,
          message:
            "Wallet balance changed. Please refresh and try again.",
          walletBalance: refreshedBalance,
        });
      }

      debitedAmount = safeTotalPrice;
      walletDebited = true;
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE ORDER
    |--------------------------------------------------------------------------
    */

    try {
      const isCashOnDelivery =
        normalizedPaymentMethod ===
        "Cash on Delivery";

      const finalPaymentId = isCashOnDelivery
        ? ""
        : String(paymentId || "").trim() ||
          generatePaymentId(normalizedPaymentMethod);

      const order = await Order.create({
        user: req.user._id,

        items: items.map((item) => ({
          product: item.product,
          name: String(item.name || "Product").trim(),
          image: String(item.image || "").trim(),
          quantity: toSafeNumber(item.quantity, 1),
          price: roundMoney(item.price),
        })),

        shippingAddress: {
          fullName: String(
            shippingAddress.fullName
          ).trim(),

          phone: String(
            shippingAddress.phone
          ).trim(),

          address: String(
            shippingAddress.address
          ).trim(),

          city: String(
            shippingAddress.city
          ).trim(),

          state: String(
            shippingAddress.state
          ).trim(),

          pincode: String(
            shippingAddress.pincode
          ).trim(),
        },

        paymentMethod: normalizedPaymentMethod,

        paymentStatus: isCashOnDelivery
          ? "Pending"
          : "Paid",

        paymentId: finalPaymentId,

        paidAt: isCashOnDelivery
          ? null
          : new Date(),

        itemsPrice: safeItemsPrice,
        deliveryCharge: safeDeliveryCharge,
        discountAmount: safeDiscountAmount,
        totalPrice: safeTotalPrice,

        orderStatus: "Pending",

        refundStatus: "Not Applicable",
        refundedAmount: 0,
        refundedAt: null,
      });

      /*
      |--------------------------------------------------------------------------
      | SAVE WALLET DEBIT TRANSACTION
      |--------------------------------------------------------------------------
      */

      if (normalizedPaymentMethod === "Wallet") {
        try {
          await WalletTransaction.create({
            user: req.user._id,
            order: order._id,

            amount: safeTotalPrice,

            type: "debit",
            reason: "Payment for order",
            status: "completed",

            balanceAfterTransaction: roundMoney(
              updatedUser.walletBalance
            ),

            paymentMethod: "wallet",
            paymentId: finalPaymentId,
          });
        } catch (transactionError) {
          /*
           * Remove order and return wallet balance if
           * wallet transaction could not be saved.
           */
          await Order.findByIdAndDelete(order._id);

          await User.findByIdAndUpdate(
            req.user._id,
            {
              $inc: {
                walletBalance: safeTotalPrice,
              },
            },
            {
              runValidators: true,
            }
          );

          walletDebited = false;
          debitedAmount = 0;

          throw transactionError;
        }
      }

      let walletBalance;

      if (normalizedPaymentMethod === "Wallet") {
        walletBalance = roundMoney(
          updatedUser.walletBalance
        );
      } else {
        walletBalance = roundMoney(
          currentUser.walletBalance
        );
      }

      return res.status(201).json({
        success: true,
        message: "Order placed successfully.",
        order,
        walletBalance,
        chargedAmount: safeTotalPrice,
      });
    } catch (orderError) {
      /*
      |--------------------------------------------------------------------------
      | RESTORE WALLET IF ORDER CREATION FAILS
      |--------------------------------------------------------------------------
      */

      if (walletDebited && debitedAmount > 0) {
        await User.findByIdAndUpdate(
          req.user._id,
          {
            $inc: {
              walletBalance: debitedAmount,
            },
          },
          {
            runValidators: true,
          }
        );

        walletDebited = false;
        debitedAmount = 0;
      }

      throw orderError;
    }
  } catch (error) {
    console.error("Create order error:", error);

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Order could not be placed.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| GET LOGGED-IN USER ORDERS
|--------------------------------------------------------------------------
| GET /api/orders/my-orders
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| GET SINGLE ORDER
|--------------------------------------------------------------------------
| GET /api/orders/:id
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| CANCEL ORDER
|--------------------------------------------------------------------------
| PUT /api/orders/:id/cancel
|--------------------------------------------------------------------------
*/

export const cancelOrder = async (req, res) => {
  let refundedToWallet = false;
  let refundAmount = 0;

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
        message:
          "Delivered order cannot be cancelled.",
      });
    }

    if (
      !cancellableStatuses.includes(
        order.orderStatus
      )
    ) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled because its status is ${order.orderStatus}.`,
      });
    }

    const shouldRefundWallet =
      order.paymentMethod === "Wallet" &&
      order.paymentStatus === "Paid" &&
      order.refundStatus !== "Completed" &&
      roundMoney(order.refundedAmount) === 0;

    let updatedUser = null;

    /*
    |--------------------------------------------------------------------------
    | REFUND WALLET PAYMENT
    |--------------------------------------------------------------------------
    */

    if (shouldRefundWallet) {
      refundAmount = roundMoney(
        order.totalPrice
      );

      const currentUser = await User.findById(
        req.user._id
      ).select("walletBalance");

      if (!currentUser) {
        return res.status(404).json({
          success: false,
          message: "User wallet was not found.",
        });
      }

      const currentBalance = roundMoney(
        currentUser.walletBalance
      );

      const newBalance = roundMoney(
        currentBalance + refundAmount
      );

      updatedUser = await User.findOneAndUpdate(
        {
          _id: req.user._id,
          walletBalance: currentUser.walletBalance,
        },
        {
          $set: {
            walletBalance: newBalance,
          },
        },
        {
          new: true,
          runValidators: true,
        }
      ).select("-password");

      if (!updatedUser) {
        return res.status(409).json({
          success: false,
          message:
            "Wallet balance changed. Please try cancelling again.",
        });
      }

      refundedToWallet = true;

      try {
        const refundPaymentId =
          `REFUND_${Date.now()}_${Math.floor(
            100000 + Math.random() * 900000
          )}`;

        const refundTransaction =
          await WalletTransaction.create({
            user: req.user._id,
            order: order._id,

            amount: refundAmount,

            type: "credit",
            reason: "Refund for cancelled order",
            status: "completed",

            balanceAfterTransaction: roundMoney(
              updatedUser.walletBalance
            ),

            paymentMethod: "refund",
            paymentId: refundPaymentId,
          });

        order.paymentStatus = "Refunded";
        order.refundStatus = "Completed";
        order.refundedAmount = refundAmount;
        order.refundedAt = new Date();
        order.refundTransaction =
          refundTransaction._id;
      } catch (refundError) {
        /*
        |--------------------------------------------------------------------------
        | ROLLBACK WALLET REFUND
        |--------------------------------------------------------------------------
        */

        await User.findByIdAndUpdate(
          req.user._id,
          {
            $inc: {
              walletBalance: -refundAmount,
            },
          },
          {
            runValidators: true,
          }
        );

        refundedToWallet = false;
        refundAmount = 0;

        throw refundError;
      }
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

    let walletBalance;

    if (updatedUser) {
      walletBalance = roundMoney(
        updatedUser.walletBalance
      );
    } else {
      const currentUser = await User.findById(
        req.user._id
      ).select("walletBalance");

      walletBalance = roundMoney(
        currentUser?.walletBalance
      );
    }

    return res.status(200).json({
      success: true,

      message: refundedToWallet
        ? "Order cancelled and amount refunded to wallet."
        : "Order cancelled successfully.",

      order,

      refundedAmount: refundedToWallet
        ? refundAmount
        : 0,

      walletBalance,
    });
  } catch (error) {
    console.error("Cancel order error:", error);

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Order could not be cancelled.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| UPDATE ORDER STATUS
|--------------------------------------------------------------------------
| PUT /api/orders/:id/status
|--------------------------------------------------------------------------
*/

export const updateOrderStatus = async (
  req,
  res
) => {
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

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID.",
      });
    }

    if (!allowedStatuses.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status.",
      });
    }

    const order = await Order.findById(
      req.params.id
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    if (order.orderStatus === "Cancelled") {
      return res.status(400).json({
        success: false,
        message:
          "Cancelled order status cannot be changed.",
      });
    }

    order.orderStatus = orderStatus;

    if (orderStatus === "Delivered") {
      order.deliveredAt = new Date();

      if (
        order.paymentMethod ===
        "Cash on Delivery"
      ) {
        order.paymentStatus = "Paid";
        order.paidAt = new Date();

        if (!order.paymentId) {
          order.paymentId =
            generatePaymentId(
              "Cash on Delivery"
            );
        }
      }
    }

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order status updated.",
      order,
    });
  } catch (error) {
    console.error(
      "Update order status error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Order status could not be updated.",
    });
  }
};