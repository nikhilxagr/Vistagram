import { useEffect } from "react";
import { useDispatch } from "react-redux";
import axios from "axios";
import { serverUrl } from "../App";
import { setPosts, setPostLoading, setPostError } from "../redux/post.Slice";

const useGetAllPosts = () => {
  const dispatch = useDispatch();

  const fetchPosts = async () => {
    dispatch(setPostLoading(true));
    try {
      const response = await axios.get(`${serverUrl}/api/posts/getall`, {
        withCredentials: true,
      });
      if (response.data) {
        dispatch(setPosts(response.data));
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
      dispatch(setPostError(error.response?.data?.message || error.message));
    } finally {
      dispatch(setPostLoading(false));
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [dispatch]);

  return { refetchPosts: fetchPosts };
};

export default useGetAllPosts;
