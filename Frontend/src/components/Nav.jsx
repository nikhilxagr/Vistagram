import React from "react";
import { GoHomeFill } from "react-icons/go";
import { FiSearch } from "react-icons/fi";
import { RxVideo } from "react-icons/rx";
import { FiPlusSquare } from "react-icons/fi";
import { useSelector } from "react-redux";
import dp from "../assets/dp.png";
import { useNavigate } from "react-router-dom";

function Nav() {
  const navigate = useNavigate();
  const { userData } = useSelector((state) => state.user);

  const handleProfileClick = () => {
    const targetUsername = userData?.username || userData?.userName || userData?._id;
    if (targetUsername) {
      navigate(`/profile/${targetUsername}`);
    } else {
      navigate("/signin");
    }
  };

  return (
    <div className="w-[90%] lg:w-[40%] h-[70px] bg-black flex justify-around items-center fixed bottom-[20px] rounded-full shadow-2xl shadow-black z-[100] border border-gray-800">
      <div
        className="cursor-pointer hover:opacity-80 transition"
        onClick={() => navigate("/")}
      >
        <GoHomeFill className="text-white w-[24px] h-[24px]" />
      </div>
      <div className="cursor-pointer hover:opacity-80 transition" onClick={() => navigate("/")}>
        <FiSearch className="text-white w-[24px] h-[24px]" />
      </div>
      <div className="cursor-pointer hover:opacity-80 transition" onClick={() => navigate("/reels")}>
        <RxVideo className="text-white w-[24px] h-[24px]" />
      </div>
      <div className="cursor-pointer hover:opacity-80 transition" onClick={() => navigate("/upload")}>
        <FiPlusSquare className="text-white w-[24px] h-[24px]" />
      </div>
      <div
        className="w-[38px] h-[38px] border border-gray-700 rounded-full cursor-pointer overflow-hidden"
        onClick={handleProfileClick}
      >
        <img
          src={userData?.profileImage || dp}
          alt="Profile Picture"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
}

export default Nav;