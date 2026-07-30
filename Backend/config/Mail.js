import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const sendMail = async (to, otp, text) => {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  try {
    await transporter.sendMail({
      from: `Vistagram <${process.env.EMAIL}>`,
      to,
      subject: `Reset Your Password — Vistagram`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; border: 1px solid #e0e0e0; border-radius: 16px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="font-size: 26px; font-weight: 800; color: #111; margin: 0; font-style: italic; letter-spacing: -0.5px;">Vistagram</h1>
          </div>
          <h2 style="margin-bottom: 8px; color: #111; text-align: center; font-size: 20px;">Password Reset OTP</h2>
          <p style="color: #555; margin-bottom: 24px; text-align: center; font-size: 14px;">Use the OTP below to reset your Vistagram password. It expires in <b>10 minutes</b>.</p>
          <div style="font-size: 34px; font-weight: bold; letter-spacing: 8px; text-align: center; padding: 18px 0; color: #111; background-color: #f4f4f6; border-radius: 12px; margin-bottom: 24px;">${otp}</div>
          <p style="color: #888; font-size: 13px; text-align: center; margin: 0;">If you did not request this, please ignore this email.</p>
        </div>
      `,
      text: `Your Vistagram OTP is: ${otp}. It expires in 10 minutes.`,
    });
    console.log(`✅ OTP email sent to ${to}`);
  } catch (error) {
    console.error("❌ Nodemailer Error:", error.message);
    throw error;
  }
};

export default sendMail;