import dotenv from "dotenv";
import app from "./app.js";
import connectDatabase from "./config/db.js";

dotenv.config();

await connectDatabase();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});