import React, { useState } from "react";
import { ClipLoader } from "react-spinners";
import axios from "axios";
import { serverUrl } from "../App";
import { useNavigate } from "react-router-dom";

function ForgotPassword() {
  const [step, setStep] = useState(1);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const navigate = useNavigate();

  // Send OTP
  const handleSendOTP = async () => {
    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const result = await axios.post(
        `${serverUrl}/api/auth/send-otp`,
        { email },
        { withCredentials: true }
      );

      setMessage({
        text: result.data.message || "OTP sent to your email!",
        type: "success",
      });
      setStep(2);
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || "Failed to send OTP",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOTP = async () => {
    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const result = await axios.post(
        `${serverUrl}/api/auth/verify-otp`,
        {
          email,
          otp,
        },
        { withCredentials: true }
      );

      setMessage({
        text: result.data.message || "OTP verified successfully!",
        type: "success",
      });
      setStep(3);
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || "Invalid OTP",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Reset Password
  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      setMessage({ text: "Passwords do not match", type: "error" });
      return;
    }

    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const result = await axios.post(
        `${serverUrl}/api/auth/reset-password`,
        {
          email,
          newPassword,
        },
        { withCredentials: true }
      );

      setMessage({
        text: result.data.message || "Password reset successful! Redirecting...",
        type: "success",
      });

      setEmail("");
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        navigate("/signin");
      }, 1500);
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || "Password reset failed",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-screen bg-gradient-to-b from-black to-gray-900 flex justify-center items-center">
      {/* STEP 1 */}
      {step === 1 && (
        <div className="w-[90%] max-w-lg bg-white rounded-2xl p-10">
          <h2 className="text-3xl font-bold text-center mb-8">
            Forgot Password
          </h2>

          <label className="font-medium">Email</label>

          <input
            type="email"
            className="w-full h-12 border-2 border-black rounded-xl px-4 mt-2 outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button
            onClick={handleSendOTP}
            disabled={loading || !email}
            className="w-full h-12 bg-black text-white rounded-xl mt-6 flex justify-center items-center cursor-pointer disabled:opacity-60"
          >
            {loading ? <ClipLoader size={20} color="#fff" /> : "Send OTP"}
          </button>

          {message.text && (
            <div
              className={`w-full mt-4 p-3 rounded-xl text-center text-sm font-medium border ${
                message.type === "success"
                  ? "bg-green-100 text-green-800 border-green-300"
                  : "bg-red-100 text-red-800 border-red-300"
              }`}
            >
              {message.text}
            </div>
          )}
        </div>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <div className="w-[90%] max-w-lg bg-white rounded-2xl p-10">
          <h2 className="text-3xl font-bold text-center mb-2">Verify OTP</h2>

          <p className="text-center text-gray-500 mb-8">
            OTP sent to <b>{email}</b>
          </p>

          <label className="font-medium">OTP</label>

          <input
            type="text"
            maxLength={6}
            className="w-full h-12 border-2 border-black rounded-xl px-4 mt-2 outline-none"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />

          <button
            onClick={handleVerifyOTP}
            disabled={loading || otp.length !== 6}
            className="w-full h-12 bg-black text-white rounded-xl mt-6 flex justify-center items-center cursor-pointer disabled:opacity-60"
          >
            {loading ? <ClipLoader size={20} color="#fff" /> : "Verify OTP"}
          </button>

          {/* Green/Red alert message below Verify OTP button */}
          {message.text && (
            <div
              className={`w-full mt-4 p-3 rounded-xl text-center text-sm font-semibold border ${
                message.type === "success"
                  ? "bg-green-100 text-green-800 border-green-300"
                  : "bg-red-100 text-red-800 border-red-300"
              }`}
            >
              {message.text}
            </div>
          )}
        </div>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <div className="w-[90%] max-w-lg bg-white rounded-2xl p-10">
          <h2 className="text-3xl font-bold text-center mb-8">
            Reset Password
          </h2>

          <label className="font-medium">New Password</label>

          <input
            type="password"
            className="w-full h-12 border-2 border-black rounded-xl px-4 mt-2 mb-5 outline-none"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />

          <label className="font-medium">Confirm Password</label>

          <input
            type="password"
            className="w-full h-12 border-2 border-black rounded-xl px-4 mt-2 outline-none"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <button
            onClick={handleResetPassword}
            disabled={loading || !newPassword || !confirmPassword}
            className="w-full h-12 bg-black text-white rounded-xl mt-6 flex justify-center items-center cursor-pointer disabled:opacity-60"
          >
            {loading ? <ClipLoader size={20} color="#fff" /> : "Reset Password"}
          </button>

          {message.text && (
            <div
              className={`w-full mt-4 p-3 rounded-xl text-center text-sm font-semibold border ${
                message.type === "success"
                  ? "bg-green-100 text-green-800 border-green-300"
                  : "bg-red-100 text-red-800 border-red-300"
              }`}
            >
              {message.text}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ForgotPassword;