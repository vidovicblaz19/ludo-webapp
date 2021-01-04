import React, { Component, useState, useEffect } from 'react';
import Button from '@material-ui/core/Button';
import {Link, useHistory} from 'react-router-dom';
import List from '@material-ui/core/List';
import IconButton from '@material-ui/core/IconButton';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Ballot from '@material-ui/icons/Ballot';
import MeetingRoomIcon from '@material-ui/icons/MeetingRoom';
import Add from '@material-ui/icons/Add';
import ModifyIcon from '@material-ui/icons/Create';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import { PinDropSharp } from '@material-ui/icons';

function JWTFrontpage(props) {
  const [roomlist, setRoomlist] = useState([]);
  var history = useHistory();

  useEffect(() => {
    //refresh frontpage
    if(props.socketauth != null){
      props.socketauth.on('frontpage_update_by_server', resp => {
        setRoomlist(resp);
      });
    }
  },[]);

  const handleCreateroomClick = (event) => {
    //create new room on backend
    event.preventDefault();
    props.socketauth.emit('createroom', {}, (resp) => {
      setRoomlist(resp);
    });
  }

  const handleRoomJoinClick = (event,roomid) => {
    //create new room on backend
    //console.log(roomname);
    props.socketauth.emit('joinroom', {roomid: roomid}, (resp) => {
      //console.log(resp);
      //setRoomlist(resp);
      history.push("/room/"+roomid);
    });
  }

  return (
    <div className="JWTFrontpage">
      <div className="Frontpage-topbar">
        <h3>Draw-webapp</h3>
        <div>
          <div>
            <Button variant="contained" color="primary" onClick={(event) => handleCreateroomClick(event)}>
                Create Room
            </Button>
              <Link className="Button" to='/profile'>
            <Button variant="contained" color="primary">
                Profil
            </Button>
          </Link>
          </div>
        </div>
      </div>
      <div className="Frontpage-content">
        <h5>Available rooms: <Button variant="contained" color="primary">
                Refresh
            </Button></h5>
        
        <div>
          <List>
            
        {roomlist.map(item => {
          let players = []; let socket = {};
          for( socket of item.sockets){
            players.push(socket.username);
          }
          return(
            <ListItem onClick={(event) => handleRoomJoinClick(event,item._id)} button key={item.name} >
              <ListItemIcon><MeetingRoomIcon/></ListItemIcon>
              <ListItemText primary={item.name} secondary={players+""}  />
              <ListItemSecondaryAction>
                <ListItemText edge="end" primary={item.sockets.length+"/8"} />
              </ListItemSecondaryAction>
            </ListItem>
          );
          })}
          </List>
        </div>
      </div>
    </div>
  );
}

export default JWTFrontpage;
