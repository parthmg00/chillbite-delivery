import mongoose from "mongoose";
import Product from "../models/Product.js";

export const createProduct = async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      shortDescription,
      category,
      brand,
      price,
      discountPercentage,
      stock,
      unit,
      images,
      isFeatured,
      isBestSeller,
      isAvailable,
      preparationTime,
      tags,
    } = req.body;

    if (
      !name ||
      !slug ||
      !description ||
      !category ||
      !brand ||
      price === undefined ||
      stock === undefined ||
      !unit
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, slug, description, category, brand, price, stock and unit are required",
      });
    }

    const normalizedSlug = slug.toLowerCase().trim();

    const existingProduct = await Product.findOne({
      slug: normalizedSlug,
    });

    if (existingProduct) {
      return res.status(409).json({
        success: false,
        message: "A product with this slug already exists",
      });
    }

    const product = await Product.create({
      name: name.trim(),
      slug: normalizedSlug,
      description: description.trim(),
      shortDescription: shortDescription?.trim() || "",
      category,
      brand: brand.trim(),
      price: Number(price),
      discountPercentage: Number(discountPercentage ?? 0),
      stock: Number(stock),
      unit: unit.trim(),
      images: Array.isArray(images) ? images : [],
      isFeatured: isFeatured ?? false,
      isBestSeller: isBestSeller ?? false,
      isAvailable: isAvailable ?? true,
      preparationTime: Number(preparationTime ?? 15),
      tags: Array.isArray(tags) ? tags : [],
    });

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("Create product error:", error);

    return res.status(500).json({
      success: false,
      message: "Product creation failed",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const {
      search,
      category,
      brand,
      minPrice,
      maxPrice,
      featured,
      bestSeller,
      available,
      sort,
      page = 1,
      limit = 12,
    } = req.query;

    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ];
    }

    if (category) {
      filter.category = category;
    }

    if (brand) {
      filter.brand = {
        $regex: brand,
        $options: "i",
      };
    }

    if (minPrice || maxPrice) {
      filter.price = {};

      if (minPrice) {
        filter.price.$gte = Number(minPrice);
      }

      if (maxPrice) {
        filter.price.$lte = Number(maxPrice);
      }
    }

    if (featured !== undefined) {
      filter.isFeatured = featured === "true";
    }

    if (bestSeller !== undefined) {
      filter.isBestSeller = bestSeller === "true";
    }

    if (available !== undefined) {
      filter.isAvailable = available === "true";
    }

    let sortOption = { createdAt: -1 };

    if (sort === "price-low") sortOption = { price: 1 };
    if (sort === "price-high") sortOption = { price: -1 };
    if (sort === "rating") sortOption = { rating: -1 };
    if (sort === "name") sortOption = { name: 1 };

    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.min(Math.max(Number(limit), 1), 50);
    const skip = (pageNumber - 1) * limitNumber;

    const totalProducts = await Product.countDocuments(filter);

    const products = await Product.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNumber);

    return res.status(200).json({
      success: true,
      count: products.length,
      totalProducts,
      currentPage: pageNumber,
      totalPages: Math.ceil(totalProducts / limitNumber),
      products,
    });
  } catch (error) {
    console.error("Get products error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch products",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};

export const getSingleProduct = async (req, res) => {
  try {
    const { identifier } = req.params;

    let product;

    if (mongoose.Types.ObjectId.isValid(identifier)) {
      product = await Product.findById(identifier);
    }

    if (!product) {
      product = await Product.findOne({
        slug: identifier.toLowerCase(),
      });
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Get product error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch product",
    });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { identifier } = req.params;

    let product;

    if (mongoose.Types.ObjectId.isValid(identifier)) {
      product = await Product.findById(identifier);
    }

    if (!product) {
      product = await Product.findOne({
        slug: identifier.toLowerCase(),
      });
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const allowedFields = [
      "name",
      "slug",
      "description",
      "shortDescription",
      "category",
      "brand",
      "price",
      "discountPercentage",
      "stock",
      "unit",
      "images",
      "isFeatured",
      "isBestSeller",
      "isAvailable",
      "preparationTime",
      "tags",
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    }

    if (req.body.slug !== undefined) {
      const normalizedSlug = req.body.slug.toLowerCase().trim();

      const duplicateProduct = await Product.findOne({
        slug: normalizedSlug,
        _id: { $ne: product._id },
      });

      if (duplicateProduct) {
        return res.status(409).json({
          success: false,
          message: "A product with this slug already exists",
        });
      }

      product.slug = normalizedSlug;
    }

    await product.save();

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    console.error("Update product error:", error);

    return res.status(500).json({
      success: false,
      message: "Product update failed",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { identifier } = req.params;

    let product;

    if (mongoose.Types.ObjectId.isValid(identifier)) {
      product = await Product.findById(identifier);
    }

    if (!product) {
      product = await Product.findOne({
        slug: identifier.toLowerCase(),
      });
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    await product.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Delete product error:", error);

    return res.status(500).json({
      success: false,
      message: "Product deletion failed",
    });
  }
};