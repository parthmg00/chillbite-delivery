import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    image: {
      type: String,
      default: "",
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    isReviewed: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: false,
  }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator(items) {
          return Array.isArray(items) && items.length > 0;
        },
        message: "Order must contain at least one item.",
      },
    },

    shippingAddress: {
      fullName: {
        type: String,
        required: true,
        trim: true,
      },

      phone: {
        type: String,
        required: true,
        trim: true,
      },

      address: {
        type: String,
        required: true,
        trim: true,
      },

      city: {
        type: String,
        required: true,
        trim: true,
      },

      state: {
        type: String,
        required: true,
        trim: true,
      },

      pincode: {
        type: String,
        required: true,
        trim: true,
      },
    },

    paymentMethod: {
      type: String,
      enum: ["Cash on Delivery", "UPI", "Card", "Wallet"],
      default: "Cash on Delivery",
    },

    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Refunded", "Failed"],
      default: "Pending",
    },

    paymentId: {
      type: String,
      default: "",
      trim: true,
    },

    paidAt: {
      type: Date,
      default: null,
    },

    itemsPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    deliveryCharge: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    orderStatus: {
      type: String,
      enum: [
        "Pending",
        "Confirmed",
        "Preparing",
        "Out for Delivery",
        "Delivered",
        "Cancelled",
      ],
      default: "Pending",
      index: true,
    },

    cancellation: {
      reason: {
        type: String,
        default: "",
        trim: true,
      },

      cancelledAt: {
        type: Date,
        default: null,
      },

      cancelledBy: {
        type: String,
        enum: ["customer", "admin", ""],
        default: "",
      },
    },

    refundStatus: {
      type: String,
      enum: ["Not Applicable", "Pending", "Completed", "Failed"],
      default: "Not Applicable",
    },

    refundedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    refundedAt: {
      type: Date,
      default: null,
    },

    refundTransaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WalletTransaction",
      default: null,
    },

    deliveredAt: {
      type: Date,
      default: null,
    },

    supportTickets: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SupportTicket",
      },
    ],

    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.index({
  user: 1,
  createdAt: -1,
});

orderSchema.index({
  orderStatus: 1,
  createdAt: -1,
});

const Order = mongoose.model("Order", orderSchema);

export default Order;