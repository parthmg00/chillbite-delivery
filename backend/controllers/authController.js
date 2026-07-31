import crypto from "node:crypto";
import bcrypt from "bcryptjs";

import User from "../models/User.js";
import LoginOtp from "../models/LoginOtp.js";
import generateToken from "../utils/generateToken.js";
import sendOtpEmail from "../utils/sendOtpEmail.js";

const formatUserResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  walletBalance: Number(user.walletBalance || 0),
});

const generateOtp = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      phone: phone?.trim() || "",
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      user: formatUserResponse(user),
    });
  } catch (error) {
    console.error("Register error:", error);

    return res.status(500).json({
      success: false,
      message: "Registration failed",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const passwordMatches = await user.comparePassword(password);

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    await LoginOtp.deleteMany({
      user: user._id,
    });

    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);

    const expiryMinutes = Number(
      process.env.OTP_EXPIRES_MINUTES || 5
    );

    const expiresAt = new Date(
      Date.now() + expiryMinutes * 60 * 1000
    );

    await LoginOtp.create({
      user: user._id,
      email: user.email,
      otpHash,
      expiresAt,
    });

    try {
      await sendOtpEmail({
        email: user.email,
        name: user.name,
        otp,
      });
    } catch (emailError) {
      await LoginOtp.deleteMany({
        user: user._id,
      });

      console.error("OTP email error:", emailError);

      return res.status(500).json({
        success: false,
        message: "Unable to send OTP email. Please try again.",
        error:
          process.env.NODE_ENV === "development"
            ? emailError.message
            : undefined,
      });
    }

    return res.status(200).json({
      success: true,
      requiresOtp: true,
      message: `OTP sent to ${user.email}`,
      email: user.email,
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};

export const verifyLoginOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedOtp = String(otp).trim();

    if (!/^\d{6}$/.test(normalizedOtp)) {
      return res.status(400).json({
        success: false,
        message: "OTP must be exactly 6 digits",
      });
    }

    const otpRecord = await LoginOtp.findOne({
      email: normalizedEmail,
    })
      .sort({
        createdAt: -1,
      })
      .select("+otpHash");

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "OTP is invalid or has expired",
      });
    }

    if (otpRecord.expiresAt.getTime() < Date.now()) {
      await LoginOtp.deleteOne({
        _id: otpRecord._id,
      });

      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please login again.",
      });
    }

    if (otpRecord.attempts >= 5) {
      await LoginOtp.deleteOne({
        _id: otpRecord._id,
      });

      return res.status(429).json({
        success: false,
        message: "Too many incorrect attempts. Please login again.",
      });
    }

    const otpMatches = await bcrypt.compare(
      normalizedOtp,
      otpRecord.otpHash
    );

    if (!otpMatches) {
      otpRecord.attempts += 1;
      await otpRecord.save();

      const attemptsLeft = Math.max(
        0,
        5 - otpRecord.attempts
      );

      return res.status(400).json({
        success: false,
        message: `Incorrect OTP. ${attemptsLeft} attempts remaining.`,
      });
    }

    const user = await User.findById(otpRecord.user);

    if (!user) {
      await LoginOtp.deleteOne({
        _id: otpRecord._id,
      });

      return res.status(404).json({
        success: false,
        message: "User account not found",
      });
    }

    await LoginOtp.deleteMany({
      user: user._id,
    });

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      requiresOtp: false,
      message: "OTP verified. Login successful.",
      token,
      user: formatUserResponse(user),
    });
  } catch (error) {
    console.error("Verify OTP error:", error);

    return res.status(500).json({
      success: false,
      message: "OTP verification failed",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};

export const resendLoginOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found",
      });
    }

    await LoginOtp.deleteMany({
      user: user._id,
    });

    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);

    const expiryMinutes = Number(
      process.env.OTP_EXPIRES_MINUTES || 5
    );

    const expiresAt = new Date(
      Date.now() + expiryMinutes * 60 * 1000
    );

    await LoginOtp.create({
      user: user._id,
      email: user.email,
      otpHash,
      expiresAt,
    });

    try {
      await sendOtpEmail({
        email: user.email,
        name: user.name,
        otp,
      });
    } catch (emailError) {
      await LoginOtp.deleteMany({
        user: user._id,
      });

      return res.status(500).json({
        success: false,
        message: "Unable to resend OTP email",
        error:
          process.env.NODE_ENV === "development"
            ? emailError.message
            : undefined,
      });
    }

    return res.status(200).json({
      success: true,
      requiresOtp: true,
      message: "A new OTP has been sent to your email",
      email: user.email,
    });
  } catch (error) {
    console.error("Resend OTP error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to resend OTP",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};

export const getMyProfile = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: formatUserResponse(req.user),
  });
};