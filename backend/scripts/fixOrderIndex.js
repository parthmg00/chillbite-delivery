import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const fixOrderIndex = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing from the .env file.");
    }

    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected.");

    const ordersCollection =
      mongoose.connection.collection("orders");

    const indexes = await ordersCollection.indexes();

    const oldIndex = indexes.find(
      (index) => index.name === "orderNumber_1"
    );

    if (oldIndex) {
      await ordersCollection.dropIndex("orderNumber_1");

      console.log(
        "✅ Old orderNumber_1 index removed successfully."
      );
    } else {
      console.log(
        "✅ orderNumber_1 index is already removed."
      );
    }
  } catch (error) {
    console.error("❌ Index cleanup failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB disconnected.");
  }
};

fixOrderIndex();