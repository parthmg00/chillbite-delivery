import dns from "node:dns";
import dotenv from "dotenv";

import app from "./app.js";
import connectDatabase from "./config/db.js";

dotenv.config();

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const PORT = Number(process.env.PORT) || 5000;

const startServer = async () => {
  try {
    await connectDatabase();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(
        `🚀 Server running on http://0.0.0.0:${PORT}`
      );
    });
  } catch (error) {
    console.error(
      `❌ Server startup failed: ${error.message}`
    );

    process.exit(1);
  }
};

startServer();