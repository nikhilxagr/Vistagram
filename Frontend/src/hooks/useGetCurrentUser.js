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
        });
        if (response.data?.user) {
          dispatch(setUserData(response.data.user));
        }
      } catch (error) {
        console.log('Error fetching current user:', error.message);
        if (error.response?.status === 401) {
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
