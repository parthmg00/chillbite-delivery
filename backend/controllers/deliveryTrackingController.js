import mongoose from "mongoose";

import Order from "../models/Order.js";
import User from "../models/User.js";

const isValidId = (id) =>
  mongoose.Types.ObjectId.isValid(id);

const canViewTracking = (order, user) => {
  if (!order || !user) {
    return false;
  }

  if (user.role === "admin") {
    return true;
  }

  if (
    String(order.user?._id || order.user) ===
    String(user._id)
  ) {
    return true;
  }

  if (
    order.deliveryBoy &&
    String(
      order.deliveryBoy?._id ||
        order.deliveryBoy
    ) === String(user._id)
  ) {
    return true;
  }

  return false;
};

const isAssignedDeliveryBoy = (order, user) => {
  if (!order || !user) {
    return false;
  }

  if (user.role === "admin") {
    return true;
  }

  return (
    user.role === "delivery" &&
    order.deliveryBoy &&
    String(
      order.deliveryBoy?._id ||
        order.deliveryBoy
    ) === String(user._id)
  );
};

/*
 * ADMIN:
 * Delivery boy ko order assign karega.
 */
export const assignDeliveryBoy = async (
  req,
  res
) => {
  try {
    const { id } = req.params;
    const { deliveryBoyId } = req.body;

    if (
      !isValidId(id) ||
      !isValidId(deliveryBoyId)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid order ID aur delivery boy ID required hai.",
      });
    }

    const deliveryBoy = await User.findOne({
      _id: deliveryBoyId,
      role: "delivery",
    });

    if (!deliveryBoy) {
      return res.status(404).json({
        success: false,
        message:
          "Delivery boy account nahi mila.",
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    order.deliveryBoy = deliveryBoy._id;

    if (order.orderStatus === "Pending") {
      order.orderStatus = "Confirmed";
    }

    await order.save();

    await order.populate(
      "deliveryBoy",
      "name email phone role"
    );

    return res.status(200).json({
      success: true,
      message:
        "Delivery boy assigned successfully.",
      order,
    });
  } catch (error) {
    console.error(
      "Assign delivery boy error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Delivery boy assign nahi hua.",
    });
  }
};

/*
 * DELIVERY BOY:
 * Apne assigned orders dekhega.
 */
export const getMyDeliveryOrders = async (
  req,
  res
) => {
  try {
    if (req.user.role !== "delivery") {
      return res.status(403).json({
        success: false,
        message:
          "Delivery account required.",
      });
    }

    const orders = await Order.find({
      deliveryBoy: req.user._id,
      orderStatus: {
        $nin: ["Cancelled"],
      },
    })
      .populate(
        "user",
        "name email phone"
      )
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error(
      "Delivery orders error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Assigned orders fetch nahi hue.",
    });
  }
};

/*
 * DELIVERY BOY:
 * Live tracking start.
 */
export const startDeliveryTracking = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID.",
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    if (
      !isAssignedDeliveryBoy(
        order,
        req.user
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Ye order aapko assign nahi hua hai.",
      });
    }

    if (
      order.orderStatus === "Delivered" ||
      order.orderStatus === "Cancelled"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Completed/cancelled order track nahi ho sakta.",
      });
    }

    order.deliveryTracking.isActive = true;
    order.deliveryTracking.startedAt =
      new Date();
    order.deliveryTracking.stoppedAt =
      null;

    order.orderStatus =
      "Out for Delivery";

    await order.save();

    return res.status(200).json({
      success: true,
      message:
        "Live delivery tracking started.",
      order,
    });
  } catch (error) {
    console.error(
      "Start tracking error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Tracking start nahi hui.",
    });
  }
};

/*
 * DELIVERY BOY:
 * GPS update backend par bhejega.
 */
export const updateDeliveryLocation =
  async (req, res) => {
    try {
      const { id } = req.params;

      const {
        latitude,
        longitude,
        accuracy,
        speed,
        heading,
      } = req.body;

      if (
        latitude === undefined ||
        longitude === undefined
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Latitude aur longitude required hain.",
        });
      }

      const lat = Number(latitude);
      const lng = Number(longitude);

      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng) ||
        lat < -90 ||
        lat > 90 ||
        lng < -180 ||
        lng > 180
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid location coordinates.",
        });
      }

      const order =
        await Order.findById(id);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found.",
        });
      }

      if (
        !isAssignedDeliveryBoy(
          order,
          req.user
        )
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Aap is order ki location update nahi kar sakte.",
        });
      }

      if (
        order.orderStatus ===
          "Delivered" ||
        order.orderStatus ===
          "Cancelled"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Order tracking already closed.",
        });
      }

      order.deliveryTracking.isActive =
        true;

      order.deliveryTracking.latitude =
        lat;

      order.deliveryTracking.longitude =
        lng;

      order.deliveryTracking.accuracy =
        Number.isFinite(Number(accuracy))
          ? Number(accuracy)
          : null;

      order.deliveryTracking.speed =
        Number.isFinite(Number(speed))
          ? Number(speed)
          : null;

      order.deliveryTracking.heading =
        Number.isFinite(Number(heading))
          ? Number(heading)
          : null;

      order.deliveryTracking.lastUpdatedAt =
        new Date();

      await order.save();

      return res.status(200).json({
        success: true,
        message: "Location updated.",
        tracking:
          order.deliveryTracking,
      });
    } catch (error) {
      console.error(
        "Update delivery location error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Location update nahi hui.",
      });
    }
  };

/*
 * CUSTOMER:
 * Apne order ki current tracking dekhega.
 */
export const getOrderTracking = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID.",
      });
    }

    const order = await Order.findById(id)
      .populate(
        "deliveryBoy",
        "name phone email role"
      )
      .select(
        "user deliveryBoy deliveryTracking orderStatus shippingAddress updatedAt"
      );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    if (!canViewTracking(order, req.user)) {
      return res.status(403).json({
        success: false,
        message:
          "Aap is order ki tracking nahi dekh sakte.",
      });
    }

    return res.status(200).json({
      success: true,
      orderStatus: order.orderStatus,
      deliveryBoy: order.deliveryBoy,
      tracking: order.deliveryTracking,
      shippingAddress:
        order.shippingAddress,
    });
  } catch (error) {
    console.error(
      "Get tracking error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Order tracking fetch nahi hui.",
    });
  }
};

/*
 * DELIVERY BOY:
 * Tracking manually stop.
 */
export const stopDeliveryTracking = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    if (
      !isAssignedDeliveryBoy(
        order,
        req.user
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Aap is tracking ko stop nahi kar sakte.",
      });
    }

    order.deliveryTracking.isActive =
      false;

    order.deliveryTracking.stoppedAt =
      new Date();

    await order.save();

    return res.status(200).json({
      success: true,
      message:
        "Live tracking stopped.",
    });
  } catch (error) {
    console.error(
      "Stop tracking error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Tracking stop nahi hui.",
    });
  }
};

/*
 * DELIVERY BOY:
 * Delivered button.
 */
export const markOrderDelivered = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    if (
      !isAssignedDeliveryBoy(
        order,
        req.user
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Aap ye order delivered mark nahi kar sakte.",
      });
    }

    order.orderStatus = "Delivered";
    order.deliveredAt = new Date();

    order.deliveryTracking.isActive =
      false;

    order.deliveryTracking.stoppedAt =
      new Date();

    await order.save();

    return res.status(200).json({
      success: true,
      message:
        "Order delivered successfully.",
      order,
    });
  } catch (error) {
    console.error(
      "Delivered error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Order delivered mark nahi hua.",
    });
  }
};