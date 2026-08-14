import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { serverUrl } from "../App";
import Post from "../components/Post";
import { FiArrowLeft } from "react-icons/fi";
import { ClipLoader } from "react-spinners";

function PostDetail() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!postId) return;
    setLoading(true);
    axios
      .get(`${serverUrl}/api/posts/${postId}`, { withCredentials: true })
      .then((res) => setPost(res.data))
      .catch(() => setError("Post not found or has been deleted."))
      .finally(() => setLoading(false));
  }, [postId]);

  return (
    <div className="w-full min-h-screen bg-black text-white flex flex-col">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 bg-black/95 backdrop-blur-md border-b border-gray-900 flex items-center gap-3 px-4 py-3.5">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-900 transition cursor-pointer -ml-2"
        >
          <FiArrowLeft size={22} />
        </button>
        <h1 className="text-base font-bold text-white">Post</h1>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center pb-24">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <ClipLoader size={30} color="#6366f1" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 text-center px-6">
            <p className="text-gray-400 text-sm">{error}</p>
            <button
              onClick={() => navigate(-1)}
              className="mt-4 text-blue-400 text-sm font-semibold hover:text-blue-300 transition cursor-pointer"
            >
              Go Back
            </button>
          </div>
        ) : post ? (
          <div className="w-full max-w-2xl">
            <Post post={post} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default PostDetail;
