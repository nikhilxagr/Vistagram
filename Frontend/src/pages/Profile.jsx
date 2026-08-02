import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { setProfileData } from '../redux/userSlice';
import { serverUrl } from '../App.jsx';
import dp from '../assets/dp.png';

function Profile() {
  const { userName } = useParams();
  const dispatch = useDispatch();
  const profileData = useSelector((state) => state.user.profileData);

  const handleProfile = async () => {
    try {
      const result = await axios.get(
        `${serverUrl}/api/users/getProfile/${userName}`,
        { withCredentials: true }
      );
      dispatch(setProfileData(result.data?.user || result.data));
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  useEffect(() => {
    if (userName) {
      handleProfile();
    }
  }, [userName, dispatch]);

  return (
    <div className="profile-container">
      {profileData ? (
        <div className="profile-content">
          <img
            src={profileData.profilePicture || dp}
            alt="Profile"
            className="profile-picture"
          />
          <h2>{profileData.name}</h2>
          <p>@{profileData.userName}</p>
          <p>{profileData.bio}</p>
        </div>
      ) : (
        <p>Loading profile...</p>
      )}
    </div>
  );
} 

      

export default Profile;