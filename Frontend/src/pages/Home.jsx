import React from "react";
import LeftHome from "../components/LeftHome";
import Feed from "../components/Feed";
import RightHome from "../components/RightHome";
import useGetSuggestedUsers from "../hooks/getSuggestedUsers";

function Home() {
  // Fetch suggested users on Home load
  useGetSuggestedUsers();

  return (
    <div className="w-full min-h-screen bg-black flex justify-center items-start overflow-x-hidden">
      <LeftHome />
      <Feed />
      <RightHome />
    </div>
  );
}

export default Home;