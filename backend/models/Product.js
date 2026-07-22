import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      minlength: [2, "Product name must be at least 2 characters"],
      maxlength: [120, "Product name cannot exceed 120 characters"],
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    description: {
      type: String,
      required: [true, "Product description is required"],
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },

    shortDescription: {
      type: String,
      trim: true,
      maxlength: [250, "Short description cannot exceed 250 characters"],
      default: "",
    },

    category: {
      type: String,
      required: [true, "Product category is required"],
      enum: [
        "ice-cream",
        "cake",
        "waffle",
        "cold-drink",
        "dessert",
        "combo",
      ],
    },

    brand: {
      type: String,
      required: [true, "Product brand is required"],
      trim: true,
    },

    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Price cannot be negative"],
    },

    discountPercentage: {
      type: Number,
      default: 0,
      min: [0, "Discount cannot be less than 0"],
      max: [90, "Discount cannot exceed 90 percent"],
    },

    stock: {
      type: Number,
      required: [true, "Product stock is required"],
      min: [0, "Stock cannot be negative"],
      default: 0,
    },

    unit: {
      type: String,
      required: [true, "Product unit is required"],
      trim: true,
      default: "1 piece",
    },

    images: [
      {
        publicId: {
          type: String,
          default: "",
        },

        url: {
          type: String,
          required: true,
        },
      },
    ],

    rating: {
      type: Number,
      default: 0,
      min: [0, "Rating cannot be less than 0"],
      max: [5, "Rating cannot exceed 5"],
    },

    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    isBestSeller: {
      type: Boolean,
      default: false,
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },

    preparationTime: {
      type: Number,
      default: 15,
      min: [0, "Preparation time cannot be negative"],
    },

    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
  },
  {
    timestamps: true,
  },
);

productSchema.virtual("finalPrice").get(function () {
  const discountAmount =
    (this.price * this.discountPercentage) / 100;

  return Math.round(this.price - discountAmount);
});

productSchema.set("toJSON", {
  virtuals: true,
});

productSchema.set("toObject", {
  virtuals: true,
});

const Product = mongoose.model("Product", productSchema);

export default Product;