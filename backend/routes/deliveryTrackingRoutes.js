import express from "express";

import {
  assignDeliveryBoy,
  getMyDeliveryOrders,
  getOrderTracking,
  markOrderDelivered,
  startDeliveryTracking,
  stopDeliveryTracking,
  updateDeliveryLocation,
} from "../controllers/deliveryTrackingController.js";

import {
  adminOnly,
  protect,
} from "../middleware/authMiddleware.js";

const router = express.Router();

/*
 * ADMIN
 */
router.put(
  "/orders/:id/assign",
  protect,
  adminOnly,
  assignDeliveryBoy
);

/*
 * DELIVERY BOY
 */
router.get(
  "/orders/mine",
  protect,
  getMyDeliveryOrders
);

router.put(
  "/orders/:id/start",
  protect,
  startDeliveryTracking
);

router.put(
  "/orders/:id/location",
  protect,
  updateDeliveryLocation
);

router.put(
  "/orders/:id/stop",
  protect,
  stopDeliveryTracking
);

router.put(
  "/orders/:id/delivered",
  protect,
  markOrderDelivered
);

/*
 * CUSTOMER / DELIVERY / ADMIN
 */
router.get(
  "/orders/:id/tracking",
  protect,
  getOrderTracking
);

export default router;