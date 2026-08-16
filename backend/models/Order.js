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
    /*
    |--------------------------------------------------------------------------
    | CUSTOMER
    |--------------------------------------------------------------------------
    */

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /*
    |--------------------------------------------------------------------------
    | DELIVERY BOY
    |--------------------------------------------------------------------------
    */

    deliveryBoy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    /*
    |--------------------------------------------------------------------------
    | LIVE DELIVERY TRACKING
    |--------------------------------------------------------------------------
    */

    deliveryTracking: {
      isActive: {
        type: Boolean,
        default: false,
      },

      latitude: {
        type: Number,
        default: null,
      },

      longitude: {
        type: Number,
        default: null,
      },

      accuracy: {
        type: Number,
        default: null,
      },

      speed: {
        type: Number,
        default: null,
      },

      heading: {
        type: Number,
        default: null,
      },

      startedAt: {
        type: Date,
        default: null,
      },

      lastUpdatedAt: {
        type: Date,
        default: null,
      },

      stoppedAt: {
        type: Date,
        default: null,
      },
    },

    /*
    |--------------------------------------------------------------------------
    | ORDER ITEMS
    |--------------------------------------------------------------------------
    */

    items: {
      type: [orderItemSchema],
      required: true,

      validate: {
        validator(items) {
          return (
            Array.isArray(items) &&
            items.length > 0
          );
        },

        message:
          "Order must contain at least one item.",
      },
    },

    /*
    |--------------------------------------------------------------------------
    | CUSTOMER DELIVERY ADDRESS + GPS
    |--------------------------------------------------------------------------
    */

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

      /*
       * Customer delivery location
       */
      latitude: {
        type: Number,
        default: null,
      },

      longitude: {
        type: Number,
        default: null,
      },
    },

    /*
    |--------------------------------------------------------------------------
    | PAYMENT
    |--------------------------------------------------------------------------
    */

    paymentMethod: {
      type: String,

      enum: [
        "Cash on Delivery",
        "UPI",
        "Card",
        "Wallet",
      ],

      default: "Cash on Delivery",
    },

    paymentStatus: {
      type: String,

      enum: [
        "Pending",
        "Paid",
        "Refunded",
        "Failed",
      ],

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

    /*
    |--------------------------------------------------------------------------
    | PRICES
    |--------------------------------------------------------------------------
    */

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

    /*
    |--------------------------------------------------------------------------
    | ORDER STATUS
    |--------------------------------------------------------------------------
    */

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

    /*
    |--------------------------------------------------------------------------
    | CANCELLATION
    |--------------------------------------------------------------------------
    */

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

        enum: [
          "customer",
          "admin",
          "",
        ],

        default: "",
      },
    },

    /*
    |--------------------------------------------------------------------------
    | REFUND
    |--------------------------------------------------------------------------
    */

    refundStatus: {
      type: String,

      enum: [
        "Not Applicable",
        "Pending",
        "Completed",
        "Failed",
      ],

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

    /*
    |--------------------------------------------------------------------------
    | DELIVERY COMPLETION
    |--------------------------------------------------------------------------
    */

    deliveredAt: {
      type: Date,
      default: null,
    },

    /*
    |--------------------------------------------------------------------------
    | SUPPORT
    |--------------------------------------------------------------------------
    */

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

/*
|--------------------------------------------------------------------------
| INDEXES
|--------------------------------------------------------------------------
*/

orderSchema.index({
  user: 1,
  createdAt: -1,
});

orderSchema.index({
  orderStatus: 1,
  createdAt: -1,
});

orderSchema.index({
  deliveryBoy: 1,
  orderStatus: 1,
  createdAt: -1,
});

const Order = mongoose.model(
  "Order",
  orderSchema
);

export default Order;