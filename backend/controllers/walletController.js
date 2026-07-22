import User from "../models/User.js";
import WalletTransaction from "../models/WalletTransaction.js";

export const getMyWallet = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "name email walletBalance"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const transactions = await WalletTransaction.find({
      user: req.user._id,
    })
      .populate("order", "orderStatus totalPrice")
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      walletBalance: Number(user.walletBalance || 0),
      transactions,
    });
  } catch (error) {
    console.error("Get wallet error:", error);

    return res.status(500).json({
      success: false,
      message: "Wallet details could not be loaded.",
    });
  }
};