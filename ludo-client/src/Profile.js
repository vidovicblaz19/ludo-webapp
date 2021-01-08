import React, { useEffect, useState } from 'react';
import Button from '@material-ui/core/Button';
import {Link} from 'react-router-dom';
import socket from 'socket.io-client';

function Profile(props) {
    const [response,setResponse] = useState({
        username:"",
        nrofgames:0,
        wins:0,
        nrofgames : 0,
			  wins : 0,
        secondplace : 0,
        thirdplace : 0,
        fourthplace : 0
    });
  
  const handleGetProfileData = (props) => {
    props.socketauth.emit('profile', {}, (resp) => {
      setResponse(resp);
    });
  }

    useEffect(() => {
      handleGetProfileData(props);
    },[props]);

  return (
    <div className="Profile">
      <div className="Profile-topbar">
        <h3>Draw-webapp</h3>
        <div>
          <div>
          <Link className="Button" to='/'>
            <Button variant="contained" color="primary">
                Back
            </Button>
          </Link>
          </div>
        </div>
      </div>
      <div className="Profile-content">
        <h4>[User profile] </h4>
        <div className="Profile-content2">
            <p>username: {response.username}</p>
            <p>number of games played: {response.nrofgames}</p>
            <p>wins: {response.wins}</p>
            <p>second places: {response.secondplace}</p>
            <p>third places: {response.thirdplace}</p>
            <p>fourth places: {response.fourthplace}</p>
        </div>
      </div>
    </div>
  );
}

export default Profile;
