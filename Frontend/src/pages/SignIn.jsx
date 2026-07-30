import React, { useState } from "react";
import logo from "../assets/logo.png";
import logo2 from "../assets/logo2.png";
import { IoIosEye, IoIosEyeOff } from "react-icons/io";
import axios from "axios";
import { serverUrl } from "../App.jsx";
import { useNavigate } from "react-router-dom";
import { ClipLoader } from "react-spinners";
import { useDispatch } from "react-redux";
import { setUserData } from "../redux/userSlice.js";

function SignIn() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post(
        `${serverUrl}/api/auth/signin`,
        { username: userName, userName, password },
        { withCredentials: true }
      );

      if (response.data?.user) {
        dispatch(setUserData(response.data.user));
      }
      navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.message || "Sign in failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-5xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-800 flex flex-col lg:flex-row min-h-[600px]">
        {/* Left Side: Form */}
        <div className="w-full lg:w-1/2 bg-white flex flex-col items-center justify-center px-8 md:px-12 py-10">
          {/* Header & Logo */}
          <div className="mb-6 flex flex-col items-center text-center">
            <img
              src={logo2}
              alt="Vistagram Logo"
              className="h-20 md:h-24 w-auto max-w-[280px] object-contain mb-3 drop-shadow-md"
            />
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
              Welcome Back
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Sign in to continue to Vistagram
            </p>
          </div>

          <form
            onSubmit={handleSignIn}
            className="w-full max-w-md flex flex-col gap-4"
          >
            {error && (
              <div className="w-full py-2.5 px-4 bg-red-50 border border-red-300 text-red-700 text-xs font-semibold rounded-xl text-center">
                {error}
              </div>
            )}

            {/* Username Input */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="userName"
                className="text-xs font-semibold text-gray-700 uppercase tracking-wider"
              >
                Username
              </label>
              <input
                type="text"
                id="userName"
                value={userName}
                className="w-full h-12 rounded-xl border border-gray-300 px-4 text-gray-900 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
                required
                onChange={(e) => setUserName(e.target.value)}
              />
            </div>

            {/* Password Input */}
            <div className="flex flex-col gap-1.5 relative">
              <div className="flex justify-between items-center">
                <label
                  htmlFor="password"
                  className="text-xs font-semibold text-gray-700 uppercase tracking-wider"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-xs font-semibold text-gray-600 hover:text-black transition"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative w-full">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  className="w-full h-12 rounded-xl border border-gray-300 px-4 pr-12 text-gray-900 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
                  required
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black transition"
                >
                  {showPassword ? (
                    <IoIosEyeOff className="text-xl" />
                  ) : (
                    <IoIosEye className="text-xl" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="mt-2 h-12 w-full cursor-pointer rounded-xl bg-black px-4 font-semibold text-white transition-all hover:bg-gray-900 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 flex items-center justify-center"
              disabled={loading}
            >
              {loading ? <ClipLoader size={20} color="#ffffff" /> : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-sm text-gray-600">
            Don't have an account?{" "}
            <span
              className="font-bold text-black border-b border-black pb-0.5 cursor-pointer hover:opacity-80 transition"
              onClick={() => navigate("/signup")}
            >
              Sign Up
            </span>
          </p>
        </div>

        {/* Right Side: Hero Section */}
        <div className="hidden lg:flex lg:w-1/2 bg-black text-white flex-col items-center justify-center p-12 relative overflow-hidden border-l border-gray-800">
          <div className="absolute w-80 h-80 bg-gradient-to-tr from-purple-600/30 to-pink-600/30 rounded-full blur-3xl opacity-50 pointer-events-none" />
          <div className="relative z-10 flex flex-col items-center text-center">
            <img
              src={logo}
              alt="Vistagram Hero Logo"
              className="w-80 md:w-96 h-auto object-contain transition-transform duration-500 hover:scale-105 drop-shadow-2xl"
            />
            <p className="mt-6 text-base md:text-lg font-semibold text-gray-200 tracking-wide max-w-sm leading-relaxed">
              Share your moments. Tell your story. Connect your world.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignIn;