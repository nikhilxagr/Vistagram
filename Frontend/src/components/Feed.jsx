import React from "react";
import logo from "../assets/logo.png";
import { FaRegHeart } from "react-icons/fa6";
import StoryDp from "./StoryDp";
import Nav from "./Nav";
import Post from "./Post";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import useGetAllPosts from "../hooks/getAllPost";
import { ClipLoader } from "react-spinners";

function Feed() {
  const navigate = useNavigate();
  useGetAllPosts();

  const { posts, loading } = useSelector((state) => state.post);

  return (
    <div className="lg:w-[50%] w-full bg-black min-h-screen relative lg:overflow-y-auto">
      <div className="w-full h-[70px] flex items-center justify-between px-6 lg:hidden border-b border-gray-900 sticky top-0 bg-black/90 backdrop-blur-md z-40">
        <img
          src={logo}
          alt="Vistagram"
          className="w-[100px] cursor-pointer hover:opacity-80 transition"
          onClick={() => navigate("/")}
        />
        <div>
          <FaRegHeart className="text-white w-[22px] h-[22px]" />
        </div>
      </div>

      <div className="flex w-full justify-start overflow-x-auto gap-3 items-center p-4 no-scrollbar">
        <StoryDp username="Nikhil" />
        <StoryDp username="Saurabh" />
      </div>

      <div className="w-full min-h-screen flex flex-col items-center gap-6 px-2 sm:px-6 pt-8 bg-white rounded-t-[40px] relative pb-[120px]">
        {loading && (!posts || posts.length === 0) ? (
          <div className="flex flex-col items-center justify-center my-12 gap-3">
            <ClipLoader size={30} color="#000000" />
            <p className="text-xs font-semibold text-gray-500">Loading feed posts...</p>
          </div>
        ) : posts && posts.length > 0 ? (
          posts.map((post) => <Post key={post._id} post={post} />)
        ) : (
          <div className="flex flex-col items-center justify-center my-12 text-center">
            <p className="text-sm font-bold text-gray-700">No posts available yet</p>
            <p className="text-xs text-gray-400 mt-1">Be the first to share a post on Vistagram!</p>
          </div>
        )}

        <Nav />
      </div>
    </div>
  );
}

export default Feed;
