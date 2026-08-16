import express from "express";

import {
  assignDeliveryBoy,
  cancelOrder,
  createOrder,
  getAdminOrders,
  getDeliveryUsers,
  getMyDeliveryOrders,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
} from "../controllers/orderController.js";

import {
  adminOnly,
  protect,
} from "../middleware/authMiddleware.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| CUSTOMER
|--------------------------------------------------------------------------
*/

/*
 * Create order
 */
router.post(
  "/",
  protect,
  createOrder
);

/*
 * Customer ke own orders
 *
 * IMPORTANT:
 * /:id se hamesha pehle.
 */
router.get(
  "/my-orders",
  protect,
  getMyOrders
);

/*
|--------------------------------------------------------------------------
| ADMIN
|--------------------------------------------------------------------------
*/

/*
 * All orders for Admin Dashboard
 */
router.get(
  "/admin/all",
  protect,
  adminOnly,
  getAdminOrders
);

/*
 * Delivery-boy users for dropdown
 */
router.get(
  "/admin/delivery-users",
  protect,
  adminOnly,
  getDeliveryUsers
);

/*
|--------------------------------------------------------------------------
| DELIVERY BOY
|--------------------------------------------------------------------------
*/

/*
 * Logged-in delivery boy ke
 * assigned orders.
 */
router.get(
  "/delivery/my-orders",
  protect,
  getMyDeliveryOrders
);

/*
|--------------------------------------------------------------------------
| ORDER ACTIONS
|--------------------------------------------------------------------------
*/

/*
 * Admin assigns delivery boy.
 */
router.put(
  "/:id/assign-delivery",
  protect,
  adminOnly,
  assignDeliveryBoy
);

/*
 * Customer cancels own order.
 */
router.put(
  "/:id/cancel",
  protect,
  cancelOrder
);

/*
 * Admin status change.
 */
router.put(
  "/:id/status",
  protect,
  adminOnly,
  updateOrderStatus
);

/*
 * IMPORTANT:
 * Dynamic /:id route always keep near bottom.
 */
router.get(
  "/:id",
  protect,
  getOrderById
);

export default router;