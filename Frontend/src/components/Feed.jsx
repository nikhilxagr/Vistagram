import React from "react";
import logo from "../assets/logo.png";
import { FaRegHeart } from "react-icons/fa6";
import StoryDp from "./StoryDp";
import Nav from "./Nav";

function Feed() {
  return (
    <div className="lg:w-[50%] w-full bg-black min-h-screen relative lg:overflow-y-auto">
      {/* Mobile Header */}
      <div className="w-full h-[70px] flex items-center justify-between px-6 lg:hidden border-b border-gray-900">
        <img src={logo} alt="Vistagram" className="w-[100px]" />
        <div>
          <FaRegHeart className="text-white w-[22px] h-[22px]" />
        </div>
      </div>

      {/* Stories Carousel */}
      <div className="flex w-full justify-start overflow-x-auto gap-3 items-center p-4">
        <StoryDp username="Nikhil" />
        <StoryDp username="Sahil" />
        <StoryDp username="Niraj" />
        <StoryDp username="Gaurav" />
        <StoryDp username="Rahul" />
        <StoryDp username="Deva" />
        <StoryDp username="Rohan" />
        <StoryDp username="Sohan" />
      </div>

      {/* Main Feed Container */}
      <div className="w-full min-h-screen flex flex-col items-center gap-5 p-4 pt-8 bg-white rounded-t-[40px] relative pb-[120px]">
        <Nav />
      </div>
    </div>
  );
}

export default Feed;
