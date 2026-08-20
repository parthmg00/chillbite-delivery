import dns from "node:dns";
import http from "node:http";
import dotenv from "dotenv";

import { Server } from "socket.io";

import app from "./app.js";
import connectDatabase from "./config/db.js";
import { setupDeliverySocket } from "./socket/deliverySocket.js";

dotenv.config();

dns.setServers([
  "8.8.8.8",
  "1.1.1.1",
]);

const PORT =
  Number(process.env.PORT) || 5000;

/*
 * ----------------------------------------------------
 * HTTP SERVER
 * ----------------------------------------------------
 */

const httpServer = http.createServer(app);

/*
 * ----------------------------------------------------
 * SOCKET.IO
 * ----------------------------------------------------
 */

const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL,
].filter(Boolean);

const io = new Server(httpServer, {
  cors: {
    origin(origin, callback) {
      /*
       * Postman / server-to-server
       */

      if (!origin) {
        return callback(null, true);
      }

      if (
        allowedOrigins.includes(origin)
      ) {
        return callback(null, true);
      }

      console.log(
        "Blocked Socket.IO origin:",
        origin
      );

      return callback(
        new Error(
          `Socket CORS blocked for origin: ${origin}`
        )
      );
    },

    credentials: true,
  },

  transports: [
    "websocket",
    "polling",
  ],
});

/*
 * Delivery tracking socket handlers
 */

setupDeliverySocket(io);

/*
 * ----------------------------------------------------
 * START SERVER
 * ----------------------------------------------------
 */

const startServer = async () => {
  try {
    await connectDatabase();

    httpServer.listen(
      PORT,
      "0.0.0.0",
      () => {
        console.log(
          `🚀 Server running on http://0.0.0.0:${PORT}`
        );

        console.log(
          "🔌 Socket.IO delivery tracking enabled."
        );
      }
    );
  } catch (error) {
    console.error(
      `❌ Server startup failed: ${error.message}`
    );

    process.exit(1);
  }
};

startServer();