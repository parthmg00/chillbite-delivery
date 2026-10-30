import mongoose from "mongoose";

const walletTransactionSchema =
  new mongoose.Schema(
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        default: null,
      },

      amount: {
        type: Number,
        required: true,
        min: 0,
      },

      type: {
        type: String,
        enum: ["credit", "debit"],
        required: true,
      },

      reason: {
        type: String,
        required: true,
        trim: true,
      },

      status: {
        type: String,
        enum: [
          "pending",
          "completed",
          "failed",
        ],
        default: "completed",
      },

      balanceAfterTransaction: {
        type: Number,
        required: true,
        min: 0,
      },

      paymentMethod: {
        type: String,
        enum: [
          "",
          "gpay",
          "phonepe",
          "upi",
          "card",
          "wallet",
          "refund",
          "razorpay",
        ],
        default: "",
      },

      paymentId: {
        type: String,
        default: "",
        trim: true,
      },

      paymentDetails: {
        upiId: {
          type: String,
          default: "",
          trim: true,
        },

        cardLastFour: {
          type: String,
          default: "",
          trim: true,
        },
      },
    },
    {
      timestamps: true,
    }
  );

walletTransactionSchema.index({
  user: 1,
  createdAt: -1,
});

walletTransactionSchema.index({
  order: 1,
});

const WalletTransaction = mongoose.model(
  "WalletTransaction",
  walletTransactionSchema
);

export default WalletTransaction;