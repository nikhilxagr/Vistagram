import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { serverUrl } from "../App";
import { setSuggestedUsers } from "../redux/userSlice";

const useGetSuggestedUsers = () => {
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.user);

  useEffect(() => {
    const fetchSuggestedUsers = async () => {
      if (!userData) return;
      try {
        const result = await axios.get(`${serverUrl}/api/users/suggested`, {
          withCredentials: true,
        });
        dispatch(setSuggestedUsers(result.data?.users || []));
      } catch (error) {
        console.log("Error fetching suggested users:", error);
        dispatch(setSuggestedUsers([]));
      }
    };

    fetchSuggestedUsers();
  }, [dispatch, userData]);
};

export default useGetSuggestedUsers;