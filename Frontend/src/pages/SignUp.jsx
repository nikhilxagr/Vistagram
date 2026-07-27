import React, { useState } from "react";
import logo from "../assets/logo.png";
import { IoIosEye } from "react-icons/io";
import { IoIosEyeOff } from "react-icons/io";
import axios from "axios";
import { serverUrl } from "../App.jsx";
import logo2 from "../assets/logo2.png";
import { useNavigate } from "react-router-dom";
import { ClipLoader } from "react-spinners";

function SignUp() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await axios.post(
        `${serverUrl}/api/auth/signup`,
        {
          name,
          userName,
          email,
          password,
        },
        { withCredentials: true },
      );
      console.log(result.data);
      navigate("/signin");
    }
    catch (err) {
      console.error("Error signing up:", err);
      setError(err.response?.data?.message || "Signup failed. Please try again.");
    }
    finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-screen bg-gradient-to-b from-black to-gray-900 flex flex-col justify-center items-center">
      <div className="w-[90%] max-w-[1150px] h-[600px] bg-white rounded-2xl flex justify-center items-center overflow-hidden border-2 border-[#1a1f23]">
        <div className="w-full lg:w-[50%] h-full bg-white flex flex-col items-center justify-center px-[42px] py-[34px]">
          <div className="mb-[42px] flex items-center justify-center gap-[14px]">
            <span className="text-[30px] font-bold text-black leading-none">
              Sign up to
            </span>
            <div className="w-[150px] h-[54px] overflow-hidden flex items-center justify-center">
              <img
                src={logo2}
                alt="Vistagram"
                className="w-[290px] max-w-none object-contain"
              />
            </div>
          </div>
          <form
            onSubmit={handleSignUp}
            className="w-full max-w-[420px] flex flex-col gap-[22px]"
          >
            {error && (
              <div className="w-full py-2 px-3 bg-red-100 border border-red-400 text-red-700 text-xs font-semibold rounded-lg text-center">
                {error}
              </div>
            )}
            <div className="relative w-full">
              <label
                htmlFor="name"
                className="absolute left-[24px] top-[-10px] z-10 bg-white px-[8px] text-[15px] leading-none text-gray-700"
              >
                Enter Your Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                className="w-full h-[52px] rounded-[16px] border-2 border-black px-[28px] text-[16px] text-gray-900 outline-none transition focus:ring-2 focus:ring-black/10"
                required
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="relative w-full">
              <label
                htmlFor="userName"
                className="absolute left-[24px] top-[-10px] z-10 bg-white px-[8px] text-[15px] leading-none text-gray-700"
              >
                Enter UserName
              </label>
              <input
                type="text"
                id="userName"
                value={userName}
                className="w-full h-[52px] rounded-[16px] border-2 border-black px-[28px] text-[16px] text-gray-900 outline-none transition focus:ring-2 focus:ring-black/10"
                required
                onChange={(e) => setUserName(e.target.value)}
              />
            </div>
            <div className="relative w-full">
              <label
                htmlFor="email"
                className="absolute left-[24px] top-[-10px] z-10 bg-white px-[8px] text-[15px] leading-none text-gray-700"
              >
                Enter Your email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                className="w-full h-[52px] rounded-[16px] border-2 border-black px-[28px] text-[16px] text-gray-900 outline-none transition focus:ring-2 focus:ring-black/10"
                required
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative w-full">
              <label
                htmlFor="password"
                className="absolute left-[24px] top-[-10px] z-10 bg-white px-[8px] text-[15px] leading-none text-gray-700"
              >
                Enter password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                className="w-full h-[52px] rounded-[16px] border-2 border-black px-[28px] pr-[58px] text-[16px] text-gray-900 outline-none transition focus:ring-2 focus:ring-black/10"
                required
                onChange={(e) => setPassword(e.target.value)}
              />
              {!showPassword ? (
                <IoIosEye
                  className="absolute right-[20px] top-1/2 h-[25px] w-[25px] -translate-y-1/2 cursor-pointer text-black"
                  onClick={() => setShowPassword(true)}
                />
              ) : (
                <IoIosEyeOff
                  className="absolute right-[20px] top-1/2 h-[25px] w-[25px] -translate-y-1/2 cursor-pointer text-black"
                  onClick={() => setShowPassword(false)}
                />
              )}
            </div>
            <button
              type="submit"
              className="mx-auto mt-[8px] h-[52px] w-[78%] cursor-pointer rounded-[16px] bg-black px-[20px] py-[10px] font-semibold text-white transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={loading}
            >
              {loading ? <ClipLoader size={20} color="#ffffff" /> : "Sign Up"}
            </button>
          </form>
          <p className="mt-[10px] cursor-pointer text-gray-800">
            Already Have an account ?{" "}
            <span
              className="border-b-2 border-b-black pb-[3px] text-black"
              onClick={() => navigate("/signin")}
            >
              Sign In
            </span>
          </p>
        </div>

        <div
          className="md:w-[50%] h-full hidden lg:flex
          justify-center items-center bg-[#000000] flex-col gap-[34px] text-white text-[18px] font-semibold rounded-l-[30px]
          shadow-2xl shadow-black"
        >
          <div className="w-[420px] max-w-[84%] h-[190px] overflow-hidden flex items-center justify-center">
            <img
              src={logo}
              alt="logo"
              className="w-[760px] max-w-none object-contain"
            />
          </div>
          <p>Your world. Your story. Your Vistagram</p>
        </div>
      </div>
    </div>
  );
}

export default SignUp;

