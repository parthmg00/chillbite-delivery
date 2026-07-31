import nodemailer from "nodemailer";

const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    throw new Error(
      "EMAIL_USER or EMAIL_APP_PASSWORD is missing from environment variables"
    );
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });
};

const sendOtpEmail = async ({ email, name, otp }) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"ChillBite" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your ChillBite Login OTP",
    text: `Hello ${name}, your ChillBite login OTP is ${otp}. It is valid for 5 minutes.`,

    html: `
      <div style="
        max-width: 520px;
        margin: 20px auto;
        padding: 30px;
        font-family: Arial, sans-serif;
        border: 1px solid #eeeeee;
        border-radius: 12px;
        background: #ffffff;
      ">
        <h2 style="color: #ef4444; margin-bottom: 10px;">
          ChillBite Login Verification
        </h2>

        <p style="font-size: 16px; color: #333333;">
          Hello ${name},
        </p>

        <p style="font-size: 16px; color: #333333;">
          Use the OTP below to complete your ChillBite login:
        </p>

        <div style="
          margin: 24px 0;
          padding: 18px;
          text-align: center;
          background: #fff7ed;
          border-radius: 10px;
          font-size: 32px;
          font-weight: bold;
          letter-spacing: 8px;
          color: #ea580c;
        ">
          ${otp}
        </div>

        <p style="font-size: 14px; color: #666666;">
          This OTP is valid for 5 minutes.
        </p>

        <p style="font-size: 14px; color: #666666;">
          If you did not try to log in, you can ignore this email.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export default sendOtpEmail;