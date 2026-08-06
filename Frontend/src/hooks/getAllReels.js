import { useEffect } from "react";
import { useDispatch } from "react-redux";
import axios from "axios";
import { serverUrl } from "../App";
import { setReels, setReelLoading, setReelError } from "../redux/reel.Slice";

const useGetAllReels = () => {
  const dispatch = useDispatch();

  const fetchReels = async () => {
    dispatch(setReelLoading(true));
    try {
      const response = await axios.get(`${serverUrl}/api/reels/getall`, {
        withCredentials: true,
      });
      if (response.data) {
        dispatch(setReels(response.data));
      }
    } catch (error) {
      console.error("Error fetching reels:", error);
      dispatch(setReelError(error.response?.data?.message || error.message));
    } finally {
      dispatch(setReelLoading(false));
    }
  };

  useEffect(() => {
    fetchReels();
  }, [dispatch]);

  return { refetchReels: fetchReels };
};

export default useGetAllReels;
