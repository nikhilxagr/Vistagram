import { useEffect } from "react";
import { useDispatch } from "react-redux";
import axios from "axios";
import { serverUrl } from "../App";
import { setStories, setStoryLoading, setStoryError } from "../redux/story.slice";

const useGetAllStories = () => {
  const dispatch = useDispatch();

  const fetchStories = async () => {
    dispatch(setStoryLoading(true));
    try {
      const response = await axios.get(`${serverUrl}/api/story/all`, {
        withCredentials: true,
      });
      if (response.data) {
        dispatch(setStories(response.data));
      }
    } catch (error) {
      console.error("Error fetching stories:", error);
      dispatch(setStoryError(error.response?.data?.message || error.message));
    } finally {
      dispatch(setStoryLoading(false));
    }
  };

  useEffect(() => {
    fetchStories();
  }, [dispatch]);

  return { refetchStories: fetchStories };
};

export default useGetAllStories;
