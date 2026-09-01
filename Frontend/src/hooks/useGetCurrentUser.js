import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { serverUrl } from '../App';
import { setUserData, setLoading } from '../redux/userSlice';

const useGetCurrentUser = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await axios.get(`${serverUrl}/api/users/current`, {
          withCredentials: true,
          timeout: 25000,
        });
        if (response.data?.user) {
          dispatch(setUserData(response.data.user));
        }
      } catch (error) {
        console.log('Error fetching current user:', error.message);
        // Only log out if backend explicitly responds with 401 Unauthorized or 403 Forbidden!
        // Never log out on network timeouts, Render backend cold starts, or temporary offline status.
        if (error.response?.status === 401 || error.response?.status === 403) {
          dispatch(setUserData(null));
        }
      } finally {
        dispatch(setLoading(false));
      }
    };

    fetchCurrentUser();
  }, [dispatch]);
};

export default useGetCurrentUser;
