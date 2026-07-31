import React from "react";
import { GoHomeFill } from "react-icons/go";
import { FiSearch } from "react-icons/fi";
import { RxVideo } from "react-icons/rx";
import { FiPlusSquare } from "react-icons/fi";
import { useSelector } from "react-redux";
import dp from "../assets/dp.png";

function Nav() {
  const { userData } = useSelector((state) => state.user);

  return (
    <div className="w-[90%] lg:w-[40%] h-[70px] bg-black flex justify-around items-center fixed bottom-[20px] rounded-full shadow-2xl shadow-black z-[100] border border-gray-800">
      <div className="cursor-pointer hover:opacity-80 transition">
        <GoHomeFill className="text-white w-[24px] h-[24px]" />
      </div>
      <div className="cursor-pointer hover:opacity-80 transition">
        <FiSearch className="text-white w-[24px] h-[24px]" />
      </div>
      <div className="cursor-pointer hover:opacity-80 transition">
        <RxVideo className="text-white w-[24px] h-[24px]" />
      </div>
      <div className="cursor-pointer hover:opacity-80 transition">
        <FiPlusSquare className="text-white w-[24px] h-[24px]" />
      </div>
      <div className="w-[38px] h-[38px] border border-gray-700 rounded-full cursor-pointer overflow-hidden">
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