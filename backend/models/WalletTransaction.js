import mongoose from "mongoose";

const walletTransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
    },

    status: {
      type: String,
      enum: ["completed", "failed"],
      default: "completed",
    },

    balanceAfterTransaction: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const WalletTransaction = mongoose.model(
  "WalletTransaction",
  walletTransactionSchema
);

export default WalletTransaction;