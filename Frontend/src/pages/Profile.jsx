import React from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useSelector } from 'react-redux';
import { useEffect } from 'react';
import axios from 'axios';
import { setProfileData } from '../redux/userSlice';
import { serverUrl } from '../app.jsx';

function Profile() {
    const {userName} = useParams();
    const dispatch = useDispatch();
    const profileData = useSelector((state) => state.user.profileData);
    const handleProfile =async () => {
        try{
            const result = await axios.get(`${serverUrl}/api/user/getProfile/${userName}`,
                {withCredentials: true})
            dispatch(setProfileData(result.data))

        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        handleProfile();
    }, [userName,dispatch]);

    return (
        <div>
          {profileData ? profileData.Name : "Loading..."}
        </div>
  ) }

export default Profile
