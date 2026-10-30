import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import walletRoutes from "./routes/walletRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import deliveryTrackingRoutes from "./routes/deliveryTrackingRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";

const app = express();

/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
|
| Local frontend:
| http://localhost:5173
|
| Production frontend:
| process.env.FRONTEND_URL
|
*/

const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      /*
       * Postman, mobile app, server-to-server requests
       * me origin missing ho sakta hai.
       */
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log("Blocked CORS origin:", origin);

      return callback(
        new Error(
          `CORS blocked for origin: ${origin}`
        )
      );
    },

    credentials: true,
  })
);

/*
|--------------------------------------------------------------------------
| Body Parsers
|--------------------------------------------------------------------------
*/

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(cookieParser());

/*
|--------------------------------------------------------------------------
| Health Route
|--------------------------------------------------------------------------
*/

app.get("/api/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "ChillBite API is running.",
  });
});

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

app.use("/api/auth", authRoutes);

app.use("/api/products", productRoutes);

app.use("/api/wallet", walletRoutes);

app.use("/api/orders", orderRoutes);

/*
 * Live delivery tracking routes
 *
 * Examples:
 *
 * PUT  /api/delivery/orders/:id/assign
 * GET  /api/delivery/orders/mine
 * PUT  /api/delivery/orders/:id/start
 * PUT  /api/delivery/orders/:id/location
 * PUT  /api/delivery/orders/:id/stop
 * PUT  /api/delivery/orders/:id/delivered
 * GET  /api/delivery/orders/:id/tracking
 */
app.use(
  "/api/delivery",
  deliveryTrackingRoutes
);

/*
 * Razorpay payment routes
 *
 * POST /api/payment/create-order
 * POST /api/payment/verify
 * POST /api/payment/verify-wallet
 */
app.use("/api/payment", paymentRoutes);

/*
|--------------------------------------------------------------------------
| 404 Handler
|--------------------------------------------------------------------------
*/

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

/*
|--------------------------------------------------------------------------
| Global Error Handler
|--------------------------------------------------------------------------
*/

app.use((error, req, res, next) => {
  console.error("Global error:", error);

  return res
    .status(error.status || 500)
    .json({
      success: false,
      message:
        error.message ||
        "Internal server error",
    });
});

export default app;