import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import Order from "../models/Order.js";
import User from "../models/User.js";

/*
 * ----------------------------------------------------
 * HELPERS
 * ----------------------------------------------------
 */

const isValidId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

const getTokenFromCookie = (cookieHeader) => {
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader
    .split(";")
    .map((cookie) => cookie.trim());

  const tokenCookie = cookies.find((cookie) =>
    cookie.startsWith("token=")
  );

  if (!tokenCookie) {
    return null;
  }

  return decodeURIComponent(
    tokenCookie.substring("token=".length)
  );
};

const canViewOrder = (order, user) => {
  if (!order || !user) {
    return false;
  }

  // ADMIN
  if (user.role === "admin") {
    return true;
  }

  // CUSTOMER
  if (
    String(order.user?._id || order.user) ===
    String(user._id)
  ) {
    return true;
  }

  // DELIVERY BOY
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

  return (
    user.role === "delivery" &&
    order.deliveryBoy &&
    String(
      order.deliveryBoy?._id ||
        order.deliveryBoy
    ) === String(user._id)
  );
};

const roomName = (orderId) => {
  return `delivery:${orderId}`;
};

/*
 * ----------------------------------------------------
 * SOCKET SETUP
 * ----------------------------------------------------
 *
 * IMPORTANT:
 * server.js me:
 *
 * import { setupDeliverySocket }
 * from "./socket/deliverySocket.js";
 *
 * aur:
 *
 * setupDeliverySocket(io);
 *
 * ----------------------------------------------------
 */

export const setupDeliverySocket = (io) => {
  /*
   * --------------------------------------------------
   * SOCKET AUTHENTICATION
   * --------------------------------------------------
   */

  io.use(async (socket, next) => {
    try {
      let token = socket.handshake.auth?.token;

      /*
       * LocalStorage / frontend token
       */

      if (!token) {
        token = getTokenFromCookie(
          socket.handshake.headers.cookie
        );
      }

      if (!token) {
        return next(
          new Error(
            "Authentication token required."
          )
        );
      }

      /*
       * JWT VERIFY
       */

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      );

      const userId =
        decoded.id ||
        decoded.userId ||
        decoded._id;

      if (!userId) {
        return next(
          new Error(
            "Invalid authentication token."
          )
        );
      }

      /*
       * FIND USER
       */

      const user = await User.findById(userId).select(
        "-password"
      );

      if (!user) {
        return next(
          new Error("User not found.")
        );
      }

      /*
       * Save user inside socket
       */

      socket.user = user;

      next();
    } catch (error) {
      console.error(
        "❌ Socket authentication error:",
        error.message
      );

      next(
        new Error(
          "Invalid or expired authentication token."
        )
      );
    }
  });

  /*
   * --------------------------------------------------
   * CONNECTION
   * --------------------------------------------------
   */

  io.on("connection", (socket) => {
    console.log(
      `🔌 Socket connected: ${socket.user._id} (${socket.user.role})`
    );

    /*
     * ------------------------------------------------
     * TRACKING JOIN
     * ------------------------------------------------
     *
     * Customer / Delivery Boy / Admin
     * order tracking room join karega.
     */

    socket.on(
      "tracking:join",
      async ({ orderId } = {}) => {
        try {
          /*
           * Validate order ID
           */

          if (!isValidId(orderId)) {
            socket.emit("tracking:error", {
              message: "Invalid order ID.",
            });

            return;
          }

          /*
           * Find order
           */

          const order =
            await Order.findById(orderId).populate(
              "deliveryBoy",
              "name phone email role"
            );

          if (!order) {
            socket.emit("tracking:error", {
              message: "Order not found.",
            });

            return;
          }

          /*
           * Security check
           */

          if (
            !canViewOrder(
              order,
              socket.user
            )
          ) {
            socket.emit("tracking:error", {
              message:
                "Aap is order ki tracking nahi dekh sakte.",
            });

            return;
          }

          /*
           * Room
           */

          const room = roomName(orderId);

          socket.join(room);

          console.log(
            `👤 ${socket.user.role} joined ${room}`
          );

          /*
           * Current tracking state
           */

          socket.emit("tracking:state", {
            orderStatus: order.orderStatus,

            deliveryBoy: order.deliveryBoy,

            tracking: order.deliveryTracking,

            shippingAddress:
              order.shippingAddress,
          });
        } catch (error) {
          console.error(
            "❌ Tracking join error:",
            error
          );

          socket.emit("tracking:error", {
            message:
              "Tracking join nahi hui.",
          });
        }
      }
    );

    /*
     * ------------------------------------------------
     * DELIVERY START
     * ------------------------------------------------
     */

    socket.on(
      "delivery:start",
      async ({ orderId } = {}) => {
        try {
          /*
           * Validate ID
           */

          if (!isValidId(orderId)) {
            socket.emit("tracking:error", {
              message: "Invalid order ID.",
            });

            return;
          }

          /*
           * Find order
           */

          const order =
            await Order.findById(orderId);

          if (!order) {
            socket.emit("tracking:error", {
              message: "Order not found.",
            });

            return;
          }

          /*
           * Only assigned delivery boy
           */

          if (
            !isAssignedDeliveryBoy(
              order,
              socket.user
            )
          ) {
            socket.emit("tracking:error", {
              message:
                "Ye order aapko assign nahi hua hai.",
            });

            return;
          }

          /*
           * Completed / cancelled
           */

          if (
            order.orderStatus ===
              "Delivered" ||
            order.orderStatus ===
              "Cancelled"
          ) {
            socket.emit("tracking:error", {
              message:
                "Completed/cancelled order track nahi ho sakta.",
            });

            return;
          }

          /*
           * Start tracking
           */

          order.deliveryTracking.isActive =
            true;

          order.deliveryTracking.startedAt =
            new Date();

          order.deliveryTracking.stoppedAt =
            null;

          order.orderStatus =
            "Out for Delivery";

          await order.save();

          /*
           * Join room
           */

          const room = roomName(orderId);

          socket.join(room);

          /*
           * Notify everyone
           */

          io.to(room).emit(
            "delivery:started",
            {
              orderId,

              orderStatus:
                order.orderStatus,

              tracking:
                order.deliveryTracking,
            }
          );

          console.log(
            `🚴 Delivery started: ${orderId}`
          );
        } catch (error) {
          console.error(
            "❌ Delivery start socket error:",
            error
          );

          socket.emit("tracking:error", {
            message:
              "Tracking start nahi hui.",
          });
        }
      }
    );

    /*
     * ------------------------------------------------
     * LIVE GPS LOCATION
     * ------------------------------------------------
     */

    socket.on(
      "delivery:location",
      async (data = {}) => {
        try {
          const {
            orderId,
            latitude,
            longitude,
            accuracy,
            speed,
            heading,
          } = data;

          /*
           * Validate order ID
           */

          if (!isValidId(orderId)) {
            socket.emit("tracking:error", {
              message: "Invalid order ID.",
            });

            return;
          }

          /*
           * Convert GPS values to Number
           */

          const lat = Number(latitude);
          const lng = Number(longitude);

          /*
           * Validate GPS
           */

          if (
            !Number.isFinite(lat) ||
            !Number.isFinite(lng) ||
            lat < -90 ||
            lat > 90 ||
            lng < -180 ||
            lng > 180
          ) {
            socket.emit("tracking:error", {
              message:
                "Invalid GPS coordinates.",
            });

            return;
          }

          /*
           * Find order
           */

          const order =
            await Order.findById(orderId);

          if (!order) {
            socket.emit("tracking:error", {
              message: "Order not found.",
            });

            return;
          }

          /*
           * Only assigned delivery boy
           */

          if (
            !isAssignedDeliveryBoy(
              order,
              socket.user
            )
          ) {
            socket.emit("tracking:error", {
              message:
                "Aap is order ki location update nahi kar sakte.",
            });

            return;
          }

          /*
           * Delivered / Cancelled
           */

          if (
            order.orderStatus ===
              "Delivered" ||
            order.orderStatus ===
              "Cancelled"
          ) {
            return;
          }

          /*
           * Make tracking active
           */

          order.deliveryTracking.isActive =
            true;

          /*
           * Save GPS
           */

          order.deliveryTracking.latitude =
            lat;

          order.deliveryTracking.longitude =
            lng;

          /*
           * Accuracy
           */

          const numericAccuracy =
            Number(accuracy);

          order.deliveryTracking.accuracy =
            Number.isFinite(
              numericAccuracy
            )
              ? numericAccuracy
              : null;

          /*
           * Speed
           */

          const numericSpeed =
            Number(speed);

          order.deliveryTracking.speed =
            Number.isFinite(numericSpeed)
              ? numericSpeed
              : null;

          /*
           * Heading
           */

          const numericHeading =
            Number(heading);

          order.deliveryTracking.heading =
            Number.isFinite(
              numericHeading
            )
              ? numericHeading
              : null;

          /*
           * Last update
           */

          order.deliveryTracking.lastUpdatedAt =
            new Date();

          /*
           * Save MongoDB
           */

          await order.save();

          /*
           * Data for frontend
           */

          const locationData = {
            orderId,

            latitude: lat,

            longitude: lng,

            accuracy:
              order.deliveryTracking
                .accuracy,

            speed:
              order.deliveryTracking
                .speed,

            heading:
              order.deliveryTracking
                .heading,

            lastUpdatedAt:
              order.deliveryTracking
                .lastUpdatedAt,
          };

          /*
           * Send live location
           * to customer + delivery boy + admin
           */

          io.to(
            roomName(orderId)
          ).emit(
            "delivery:location",
            locationData
          );
        } catch (error) {
          console.error(
            "❌ Delivery location socket error:",
            error
          );

          socket.emit("tracking:error", {
            message:
              "Location update nahi hui.",
          });
        }
      }
    );

    /*
     * ------------------------------------------------
     * STOP TRACKING
     * ------------------------------------------------
     */

    socket.on(
      "delivery:stop",
      async ({ orderId } = {}) => {
        try {
          /*
           * Validate
           */

          if (!isValidId(orderId)) {
            socket.emit("tracking:error", {
              message: "Invalid order ID.",
            });

            return;
          }

          /*
           * Find order
           */

          const order =
            await Order.findById(orderId);

          if (!order) {
            socket.emit("tracking:error", {
              message: "Order not found.",
            });

            return;
          }

          /*
           * Permission
           */

          if (
            !isAssignedDeliveryBoy(
              order,
              socket.user
            )
          ) {
            socket.emit("tracking:error", {
              message:
                "Aap tracking stop nahi kar sakte.",
            });

            return;
          }

          /*
           * Stop
           */

          order.deliveryTracking.isActive =
            false;

          order.deliveryTracking.stoppedAt =
            new Date();

          await order.save();

          /*
           * Notify room
           */

          io.to(
            roomName(orderId)
          ).emit(
            "delivery:stopped",
            {
              orderId,

              tracking:
                order.deliveryTracking,
            }
          );

          console.log(
            `🛑 Delivery tracking stopped: ${orderId}`
          );
        } catch (error) {
          console.error(
            "❌ Stop tracking socket error:",
            error
          );

          socket.emit("tracking:error", {
            message:
              "Tracking stop nahi hui.",
          });
        }
      }
    );

    /*
     * ------------------------------------------------
     * DELIVERED
     * ------------------------------------------------
     */

    socket.on(
      "delivery:delivered",
      async ({ orderId } = {}) => {
        try {
          /*
           * Validate
           */

          if (!isValidId(orderId)) {
            socket.emit("tracking:error", {
              message: "Invalid order ID.",
            });

            return;
          }

          /*
           * Find order
           */

          const order =
            await Order.findById(orderId);

          if (!order) {
            socket.emit("tracking:error", {
              message: "Order not found.",
            });

            return;
          }

          /*
           * Permission
           */

          if (
            !isAssignedDeliveryBoy(
              order,
              socket.user
            )
          ) {
            socket.emit("tracking:error", {
              message:
                "Aap ye order delivered mark nahi kar sakte.",
            });

            return;
          }

          /*
           * Mark delivered
           */

          order.orderStatus =
            "Delivered";

          order.deliveredAt =
            new Date();

          order.deliveryTracking.isActive =
            false;

          order.deliveryTracking.stoppedAt =
            new Date();

          await order.save();

          /*
           * Notify room
           */

          io.to(
            roomName(orderId)
          ).emit(
            "delivery:delivered",
            {
              orderId,

              orderStatus:
                order.orderStatus,

              tracking:
                order.deliveryTracking,
            }
          );

          console.log(
            `✅ Order delivered: ${orderId}`
          );
        } catch (error) {
          console.error(
            "❌ Delivered socket error:",
            error
          );

          socket.emit("tracking:error", {
            message:
              "Order delivered mark nahi hua.",
          });
        }
      }
    );

    /*
     * ------------------------------------------------
     * DISCONNECT
     * ------------------------------------------------
     */

    socket.on(
      "disconnect",
      (reason) => {
        console.log(
          `🔌 Socket disconnected: ${socket.user._id} - ${reason}`
        );
      }
    );
  });

  console.log(
    "🔌 Delivery Socket handlers initialized."
  );
};