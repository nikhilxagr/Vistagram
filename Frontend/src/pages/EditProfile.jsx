import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { setUserData } from "../redux/userSlice";
import { serverUrl } from "../App.jsx";
import dp from "../assets/dp.png";
import { FiArrowLeft, FiCamera } from "react-icons/fi";
import { ClipLoader } from "react-spinners";
import Nav from "../components/Nav";

function EditProfile() {
  const { userData } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [name, setName] = useState(userData?.name || "");
  const [username, setUsername] = useState(userData?.username || userData?.userName || "");
  const [bio, setBio] = useState(userData?.bio || "");
  const [profession, setProfession] = useState(userData?.profession || "");
  const [gender, setGender] = useState(userData?.gender || "Prefer not to say");

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(userData?.profileImage || dp);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("username", username);
      formData.append("bio", bio);
      formData.append("profession", profession);
      formData.append("gender", gender);

      if (selectedFile) {
        formData.append("profileImage", selectedFile);
      }

      const response = await axios.put(
        `${serverUrl}/api/users/editProfile`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          withCredentials: true,
        }
      );

      if (response.data?.user) {
        dispatch(setUserData(response.data.user));
      }

      setMessage({
        text: response.data.message || "Profile updated successfully!",
        type: "success",
      });

      setTimeout(() => {
        navigate(`/profile/${username}`);
      }, 1200);
    } catch (err) {
      console.error("Error updating profile:", err);
      setMessage({
        text: err.response?.data?.message || "Failed to update profile",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-black text-white flex flex-col items-center relative pb-28">
      {/* Top Header */}
      <header className="w-full max-w-2xl flex items-center justify-between px-6 py-4 border-b border-gray-900 sticky top-0 bg-black/90 backdrop-blur-md z-50">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-white text-xl hover:opacity-80 transition cursor-pointer p-1"
          aria-label="Go Back"
        >
          <FiArrowLeft />
        </button>

        <h1 className="text-base md:text-lg font-bold text-white tracking-wide">
          Edit Profile
        </h1>

        <button
          onClick={handleSave}
          disabled={loading}
          className="text-blue-500 font-bold text-sm hover:text-blue-400 transition cursor-pointer disabled:opacity-50"
        >
          {loading ? <ClipLoader size={16} color="#3b82f6" /> : "Done"}
        </button>
      </header>

      {/* Main Form Container */}
      <main className="w-full max-w-lg px-6 pt-8 flex flex-col items-center">
        {/* Profile Picture Upload Section */}
        <div className="relative group mb-6 cursor-pointer">
          <div className="w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-2 border-gray-800 shadow-2xl bg-gray-900 relative">
            <img
              src={previewImage}
              alt="Profile Avatar"
              className="w-full h-full object-cover"
            />
            <label
              htmlFor="profileImageInput"
              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition cursor-pointer"
            >
              <FiCamera className="text-white text-2xl mb-1" />
              <span className="text-[11px] font-semibold text-gray-200">
                Change Photo
              </span>
            </label>
          </div>
          <input
            type="file"
            id="profileImageInput"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <label
          htmlFor="profileImageInput"
          className="text-blue-500 font-bold text-sm hover:underline cursor-pointer mb-8"
        >
          Change profile photo
        </label>

        {/* Message Banner */}
        {message.text && (
          <div
            className={`w-full mb-6 py-2.5 px-4 rounded-xl text-center text-xs font-semibold border ${
              message.type === "success"
                ? "bg-green-500/10 text-green-400 border-green-500/30"
                : "bg-red-500/10 text-red-400 border-red-500/30"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleSave} className="w-full flex flex-col gap-5">
          {/* Name Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-12 rounded-xl bg-gray-900 border border-gray-800 px-4 text-white text-sm outline-none focus:border-gray-700 transition"
              required
            />
          </div>

          {/* Username Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full h-12 rounded-xl bg-gray-900 border border-gray-800 px-4 text-white text-sm outline-none focus:border-gray-700 transition"
              required
            />
          </div>

          {/* Bio Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full rounded-xl bg-gray-900 border border-gray-800 p-4 text-white text-sm outline-none focus:border-gray-700 transition resize-none"
            />
          </div>

          {/* Profession / Tagline */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Profession / Tagline
            </label>
            <input
              type="text"
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
              className="w-full h-12 rounded-xl bg-gray-900 border border-gray-800 px-4 text-white text-sm outline-none focus:border-gray-700 transition"
            />
          </div>

          {/* Gender Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Gender
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full h-12 rounded-xl bg-gray-900 border border-gray-800 px-4 text-white text-sm outline-none focus:border-gray-700 transition"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Custom">Custom</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 mt-4 rounded-xl bg-white text-black font-bold text-sm hover:bg-gray-200 transition shadow-lg flex items-center justify-center cursor-pointer disabled:opacity-60"
          >
            {loading ? <ClipLoader size={20} color="#000000" /> : "Save Changes"}
          </button>
        </form>
      </main>

      {/* Bottom Nav */}
      <Nav />
    </div>
  );
}

export default EditProfile;
