
import React, { useEffect, useState , useRef } from 'react';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import PersonIcon from '@material-ui/icons/Person';
import {Link, useHistory} from 'react-router-dom';
import List from '@material-ui/core/List';
import IconButton from '@material-ui/core/IconButton';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Ballot from '@material-ui/icons/Ballot';
import MeetingRoomIcon from '@material-ui/icons/MeetingRoom';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import Add from '@material-ui/icons/Add';
import TextareaAutosize from '@material-ui/core/TextareaAutosize';
import Paper from '@material-ui/core/Paper';
import CanvasDraw from "react-canvas-draw";
import { Socket } from 'socket.io-client';
import useCountDown from 'react-countdown-hook';
import jwt from 'jsonwebtoken';
import Confetti from 'react-confetti';

const initialTime = 180 * 1000; // initial time in milliseconds, defaults to 60000
const interval = 1000; // interval to change remaining time amount, defaults to 1000

//JsonWebTokenSecret
const accessTokenSecret = 'jsonWebTokenWeakSecret';

function Room(props) {
    var history = useHistory();
    const [messageInput, setMessageInput] = useState("");
    const [messageBox,setMessageBox] = useState("");
    const [timeLeft,{start,pause,resume,reset}] = useCountDown(initialTime, interval);
    const [roomInfo,setRoomInfo] = useState({
        _id: 0,
        name: "",
        sockets: [],
        indexsocketturn:0,
        socketturnstage:0,
        gameactive:false,
        spawn0:[],
        spawn1:[],
        spawn2:[],
        spawn3:[],
        field:[],
        safe0:[],
        safe1:[],
        safe2:[],
        safe3:[],
        currDiceRoll:0,
    });
    const [word,setWord] = useState("");
    const [somebodywon,setSomebodywon] = useState(false);

    const initLudoObj = (color,index) => {
        let className;
         //if blue
        if(color === 0){ className = "gamepiece-blue"; }
        //if red
        else if(color === 1){ className = "gamepiece-red"; }
        //if yellow
        else if(color === 2){ className = "gamepiece-yellow";  }
        //if green
        else if(color === 3){ className = "gamepiece-green";  }

        let tmp = {
            active: false,
            color: color,
            index: index,
            className:className,
        };
        return tmp;
    }

    const initLudoObjField = () => {
        let tmp = {
            active: false,
            color: 5,
            index: -1,
            className:'none',
        };
        return tmp;
    }

    const handleMessageInput = (event) => {
        setMessageInput(event.target.value);
    }

    useEffect(() => {
        props.socketauth.on('room_update_by_server', room => {
            //console.log(roomInfo);
            setRoomInfo(room);
        });
        props.socketauth.on('userMessage', data => {
            let string = data.username + ": " + data.message + "\n";
            setMessageBox(oldData => [...oldData , string]);
        });

    },[props.socketauth]);

    const handleEnterPress = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            props.socketauth.emit('message', {'message':messageInput, 'roomid':window.location.pathname.substr(6)}, (resp) => {
            //console.log(resp);
            //setRoomlist(resp);
            });
        }
    }

    const handleRoomStartgameClick = (event) => {
        event.preventDefault();
        let roomid = window.location.pathname.substr(6);
        props.socketauth.emit('startgame', {roomid: roomid}, (resp) => {
            if(resp !== null){
                console.log(resp);
            }else{
                alert("you cannot start game.");
            }
        });
    }

    const handleDiceThrowClick = (event) => {
       event.preventDefault();
       let roomid = window.location.pathname.substr(6);
      
       props.socketauth.emit('throwdice', {roomid: roomid}, (resp) => {
            if(resp !== null){
                setRoomInfo(resp);
                alert("Dice throw: "+resp.currDiceRoll);
                console.log(resp);
            }else{
                alert("Not your turn.");
            }
        });
    }

    const handleGameboardSpawnClick = (event, color, index) => {
        event.preventDefault();
        let roomid = window.location.pathname.substr(6);

        props.socketauth.emit('spawnmove', {roomid: roomid, color: color, index: index}, (resp) => {
            if(resp !== null){
                //set room info to represent moved piece
                setRoomInfo(resp);
                console.log(resp);

            }else{
                alert("Invalid move.");
            }
        });
        
    }

    const handleGameboardFieldClick = (event,index) => {
        event.preventDefault();
        let roomid = window.location.pathname.substr(6);

        props.socketauth.emit('fieldmove', {roomid: roomid, index: index}, (resp) => {
            if(resp !== null){
                //set room info to represent moved piece
                setRoomInfo(resp);
                console.log(resp);

            }else{
                alert("Invalid move.");
            }
        });
     }

    const handleGameboardSafeClick = (event, color, index) => {
        event.preventDefault();
        let roomid = window.location.pathname.substr(6);

    }

    const handleRoomLeaveClick = (event) => {
        let roomid = window.location.pathname.substr(6);
        props.socketauth.emit('leaveroom', {roomid: roomid}, (resp) => {
            history.push("/");
        });
    }

    const renderGamepiece = (obj) => {
        if(obj === undefined){
            return(
                <div className="none"></div>
              );
        }
        if(obj.active){
          return(
            <div className={obj.className}></div>
          );
        }else{ 
          return(
            <div className="none"></div>
          );
        }
      }

  return (
        <div className="Room-container">
            <div className="Room-sidebar">
                <div>
                    <Confetti run={somebodywon}/>
                    <h3>Players in the room:</h3>
                </div>
                <div>
                    <List>
                    {roomInfo.sockets.map(item => {
                        return(
                            <ListItem key={item._id} dense>
                                <ListItemIcon><PersonIcon/></ListItemIcon>
                                <ListItemText primary={item.username} />
                                <ListItemSecondaryAction>
                                    <ListItemText secondary={item.points} />
                                </ListItemSecondaryAction>
                            </ListItem>
                        );
                    })}
                    </List>
                </div>
                <div>
                <TextareaAutosize itemID="Textarea"
                    rowsMax={20}
                    rowsMin={20}
                    cols={28}
                    placeholder="Chat"
                    readOnly={true}
                    value={messageBox}
                    />
                </div>
                <div>
                    <form /*onSubmit={handleSubmit}*/ noValidate autoComplete="off">
                        <div>
                            <TextField className='TextField' placeholder="Send Message." onChange={(event) => handleMessageInput(event)} onKeyDown={(event) => handleEnterPress(event)} id="msgInput" variant="outlined" />
                        </div>
                    </form>
                </div>

            </div>
            <div className="Room-content">
                <div className="Room-toolbar">
                    <div style={{paddingTop:"20px"}}>
                        <Button onClick={(event) => handleDiceThrowClick(event)} variant="contained" type='submit' color="primary">
                            Met kocke
                        </Button>
                    </div>
                    <div>
                    
                    </div>
                    <div style={{paddingTop:"20px"}}>
                            <Button onClick={(event) => handleRoomLeaveClick(event)} variant="contained" type='submit' color="primary">
                                    Leave Room
                            </Button>
                    </div>
                    <div style={{paddingTop:"20px"}}>
                            <Button onClick={(event) => handleRoomStartgameClick(event)} variant="contained" type='submit' color="primary">
                                    Start game
                            </Button>
                    </div>
                </div>
                <div className="Room-spawnarea">
                    <div className="Room-Gamespawn spawn0">
                        <div className="box" onClick={(event) => handleGameboardSpawnClick(event,0,0)}>
                            {renderGamepiece(roomInfo.spawn0[0])}
                        </div>
                        <div className="box" onClick={(event) => handleGameboardSpawnClick(event,0,1)}>
                            {renderGamepiece(roomInfo.spawn0[1])}
                        </div>
                        <div className="box" onClick={(event) => handleGameboardSpawnClick(event,0,2)}>
                            {renderGamepiece(roomInfo.spawn0[2])}
                        </div>
                        <div className="box" onClick={(event) => handleGameboardSpawnClick(event,0,3)}>
                            {renderGamepiece(roomInfo.spawn0[3])}
                        </div>
                    </div>
                    <div className="Room-Gamespawn spawn1">
                        <div className="box" onClick={(event) => handleGameboardSpawnClick(event,1,0)}>
                            {renderGamepiece(roomInfo.spawn1[0])}
                        </div>
                        <div className="box" onClick={(event) => handleGameboardSpawnClick(event,1,1)}>
                            {renderGamepiece(roomInfo.spawn1[1])}
                        </div>
                        <div className="box" onClick={(event) => handleGameboardSpawnClick(event,1,2)}>
                            {renderGamepiece(roomInfo.spawn1[2])}
                        </div>
                        <div className="box" onClick={(event) => handleGameboardSpawnClick(event,1,3)}>
                            {renderGamepiece(roomInfo.spawn1[3])}
                        </div>
                    </div>
                    <div className="Room-Gamespawn spawn2">
                        <div className="box" onClick={(event) => handleGameboardSpawnClick(event,2,0)}>
                            {renderGamepiece(roomInfo.spawn2[0])}    
                        </div>
                        <div className="box" onClick={(event) => handleGameboardSpawnClick(event,2,1)}>
                            {renderGamepiece(roomInfo.spawn2[1])}    
                        </div>
                        <div className="box" onClick={(event) => handleGameboardSpawnClick(event,2,2)}>
                            {renderGamepiece(roomInfo.spawn2[2])}    
                        </div>
                        <div className="box" onClick={(event) => handleGameboardSpawnClick(event,2,3)}>
                            {renderGamepiece(roomInfo.spawn2[3])}    
                        </div>
                    </div>
                    <div className="Room-Gamespawn spawn3">
                        <div className="box" onClick={(event) => handleGameboardSpawnClick(event,3,0)}>
                            {renderGamepiece(roomInfo.spawn3[0])}    
                        </div>
                        <div className="box" onClick={(event) => handleGameboardSpawnClick(event,3,1)}>
                            {renderGamepiece(roomInfo.spawn3[1])}    
                        </div>
                        <div className="box" onClick={(event) => handleGameboardSpawnClick(event,3,2)}>
                            {renderGamepiece(roomInfo.spawn3[2])}    
                        </div>
                        <div className="box" onClick={(event) => handleGameboardSpawnClick(event,3,3)}>
                            {renderGamepiece(roomInfo.spawn3[3])}    
                        </div>
                    </div>
                </div>
                <div className="Room-Gameboard">
                    <div className="box boxtop0" onClick={(event) => handleGameboardFieldClick(event,0)}>
                        {renderGamepiece(roomInfo.field[0])}
                    </div>
                    <div className="box boxtop1" onClick={(event) => handleGameboardFieldClick(event,1)}>
                        {renderGamepiece(roomInfo.field[1])}
                    </div>
                    <div className="box boxtop2" onClick={(event) => handleGameboardFieldClick(event,2)}>
                        {renderGamepiece(roomInfo.field[2])}
                    </div>
                    <div className="box boxtop3" onClick={(event) => handleGameboardFieldClick(event,3)}>
                        {renderGamepiece(roomInfo.field[3])}
                    </div>
                    <div className="box boxtop4" onClick={(event) => handleGameboardFieldClick(event,4)}>
                        {renderGamepiece(roomInfo.field[4])}
                    </div>
                    <div className="box boxtop5" onClick={(event) => handleGameboardFieldClick(event,5)}>
                        {renderGamepiece(roomInfo.field[5])}
                    </div>
                    <div className="box boxtop6" onClick={(event) => handleGameboardFieldClick(event,6)}>
                        {renderGamepiece(roomInfo.field[6])}
                    </div>
                    <div className="box boxtop7" onClick={(event) => handleGameboardFieldClick(event,7)}>
                        {renderGamepiece(roomInfo.field[7])}
                    </div>
                    <div className="box boxtop8" onClick={(event) => handleGameboardFieldClick(event,8)}>
                        {renderGamepiece(roomInfo.field[8])}
                    </div>
                    <div className="box boxtop9" onClick={(event) => handleGameboardFieldClick(event,9)}>
                        {renderGamepiece(roomInfo.field[9])}
                    </div>
                    <div className="box boxright0" onClick={(event) => handleGameboardFieldClick(event,10)}>
                        {renderGamepiece(roomInfo.field[10])}
                    </div>
                    <div className="box boxright1" onClick={(event) => handleGameboardFieldClick(event,11)}>
                        {renderGamepiece(roomInfo.field[11])}
                    </div>
                    <div className="box boxright2" onClick={(event) => handleGameboardFieldClick(event,12)}>
                        {renderGamepiece(roomInfo.field[12])}
                    </div>
                    <div className="box boxright3" onClick={(event) => handleGameboardFieldClick(event,13)}>
                        {renderGamepiece(roomInfo.field[13])}
                    </div>
                    <div className="box boxright4" onClick={(event) => handleGameboardFieldClick(event,14)}>
                        {renderGamepiece(roomInfo.field[14])}
                    </div>
                    <div className="box boxright5" onClick={(event) => handleGameboardFieldClick(event,15)}>
                        {renderGamepiece(roomInfo.field[15])}
                    </div>
                    <div className="box boxright6" onClick={(event) => handleGameboardFieldClick(event,16)}>
                        {renderGamepiece(roomInfo.field[16])}
                    </div>
                    <div className="box boxright7" onClick={(event) => handleGameboardFieldClick(event,17)}>
                        {renderGamepiece(roomInfo.field[17])}
                    </div>
                    <div className="box boxright8" onClick={(event) => handleGameboardFieldClick(event,18)}>
                        {renderGamepiece(roomInfo.field[18])}
                    </div>
                    <div className="box boxright9" onClick={(event) => handleGameboardFieldClick(event,19)}>
                        {renderGamepiece(roomInfo.field[19])}
                    </div>
                    <div className="box boxbottom0" onClick={(event) => handleGameboardFieldClick(event,20)}>
                        {renderGamepiece(roomInfo.field[20])}
                    </div>
                    <div className="box boxbottom1" onClick={(event) => handleGameboardFieldClick(event,21)}>
                        {renderGamepiece(roomInfo.field[21])}
                    </div>
                    <div className="box boxbottom2" onClick={(event) => handleGameboardFieldClick(event,22)}>
                        {renderGamepiece(roomInfo.field[22])}
                    </div>
                    <div className="box boxbottom3" onClick={(event) => handleGameboardFieldClick(event,23)}>
                        {renderGamepiece(roomInfo.field[23])}
                    </div>
                    <div className="box boxbottom4" onClick={(event) => handleGameboardFieldClick(event,24)}>
                        {renderGamepiece(roomInfo.field[24])}
                    </div>
                    <div className="box boxbottom5" onClick={(event) => handleGameboardFieldClick(event,25)}>
                        {renderGamepiece(roomInfo.field[25])}
                    </div>
                    <div className="box boxbottom6" onClick={(event) => handleGameboardFieldClick(event,26)}>
                        {renderGamepiece(roomInfo.field[26])}
                    </div>
                    <div className="box boxbottom7" onClick={(event) => handleGameboardFieldClick(event,27)}>
                        {renderGamepiece(roomInfo.field[27])}
                    </div>
                    <div className="box boxbottom8" onClick={(event) => handleGameboardFieldClick(event,28)}>
                        {renderGamepiece(roomInfo.field[28])}
                    </div>
                    <div className="box boxbottom9" onClick={(event) => handleGameboardFieldClick(event,29)}>
                        {renderGamepiece(roomInfo.field[29])}
                    </div>
                    <div className="box boxleft0" onClick={(event) => handleGameboardFieldClick(event,30)}>
                        {renderGamepiece(roomInfo.field[30])}
                    </div>
                    <div className="box boxleft1" onClick={(event) => handleGameboardFieldClick(event,31)}>
                        {renderGamepiece(roomInfo.field[31])}
                    </div>
                    <div className="box boxleft2" onClick={(event) => handleGameboardFieldClick(event,32)}>
                        {renderGamepiece(roomInfo.field[32])}
                    </div>
                    <div className="box boxleft3" onClick={(event) => handleGameboardFieldClick(event,33)}>
                        {renderGamepiece(roomInfo.field[33])}
                    </div>
                    <div className="box boxleft4" onClick={(event) => handleGameboardFieldClick(event,34)}>
                        {renderGamepiece(roomInfo.field[34])}
                    </div>
                    <div className="box boxleft5" onClick={(event) => handleGameboardFieldClick(event,35)}>
                        {renderGamepiece(roomInfo.field[35])}
                    </div>
                    <div className="box boxleft6" onClick={(event) => handleGameboardFieldClick(event,36)}>
                        {renderGamepiece(roomInfo.field[36])}
                    </div>
                    <div className="box boxleft7" onClick={(event) => handleGameboardFieldClick(event,37)}>
                        {renderGamepiece(roomInfo.field[37])}
                    </div>
                    <div className="box boxleft8" onClick={(event) => handleGameboardFieldClick(event,38)}>
                        {renderGamepiece(roomInfo.field[38])}
                    </div>
                    <div className="box boxleft9" onClick={(event) => handleGameboardFieldClick(event,39)}>
                        {renderGamepiece(roomInfo.field[39])}
                    </div>
                    <div className="home0 home00" onClick={(event) => handleGameboardSafeClick(event,0,0)}>
                        {renderGamepiece(roomInfo.safe0[0])}
                    </div>
                    <div className="home0 home01" onClick={(event) => handleGameboardSafeClick(event,0,1)}>
                        {renderGamepiece(roomInfo.safe0[1])}
                    </div>
                    <div className="home0 home02" onClick={(event) => handleGameboardSafeClick(event,0,2)}>
                        {renderGamepiece(roomInfo.safe0[2])}
                    </div>
                    <div className="home0 home03" onClick={(event) => handleGameboardSafeClick(event,0,3)}>
                        {renderGamepiece(roomInfo.safe0[3])}
                    </div>
                    <div className="home1 home10" onClick={(event) => handleGameboardSafeClick(event,1,0)}>
                        {renderGamepiece(roomInfo.safe1[0])}
                    </div>
                    <div className="home1 home11" onClick={(event) => handleGameboardSafeClick(event,1,1)}>
                        {renderGamepiece(roomInfo.safe1[1])}
                    </div>
                    <div className="home1 home12" onClick={(event) => handleGameboardSafeClick(event,1,2)}>
                        {renderGamepiece(roomInfo.safe1[2])}
                    </div>
                    <div className="home1 home13" onClick={(event) => handleGameboardSafeClick(event,1,3)}>
                        {renderGamepiece(roomInfo.safe1[3])}
                    </div>
                    <div className="home2 home20" onClick={(event) => handleGameboardSafeClick(event,2,0)}>
                        {renderGamepiece(roomInfo.safe2[0])}
                    </div>
                    <div className="home2 home21" onClick={(event) => handleGameboardSafeClick(event,2,1)}>
                        {renderGamepiece(roomInfo.safe2[1])}
                    </div>
                    <div className="home2 home22" onClick={(event) => handleGameboardSafeClick(event,2,2)}>
                        {renderGamepiece(roomInfo.safe2[2])}
                    </div>
                    <div className="home2 home23" onClick={(event) => handleGameboardSafeClick(event,2,3)}>
                        {renderGamepiece(roomInfo.safe2[3])}
                    </div>
                    <div className="home3 home30" onClick={(event) => handleGameboardSafeClick(event,3,0)}>
                        {renderGamepiece(roomInfo.safe3[0])}
                    </div>
                    <div className="home3 home31" onClick={(event) => handleGameboardSafeClick(event,3,1)}>
                        {renderGamepiece(roomInfo.safe3[1])}
                    </div>
                    <div className="home3 home32" onClick={(event) => handleGameboardSafeClick(event,3,2)}>
                        {renderGamepiece(roomInfo.safe3[2])}
                    </div>
                    <div className="home3 home33" onClick={(event) => handleGameboardSafeClick(event,3,3)}>
                        {renderGamepiece(roomInfo.safe3[3])}
                    </div>
                </div>
            </div>
        </div>
  );
}

export default Room;
