
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
        word:"",
        timestamp:0,
        nrofplayersguessed:0,
    });
    const [word,setWord] = useState("");
    const [somebodywon,setSomebodywon] = useState(false);
    const gameboard = useRef(null);
    const gamespawn0 = useRef(null);
    const gamehome0 = useRef(null);
    const gamespawn1 = useRef(null);
    const gamehome1 = useRef(null);
    const gamespawn2 = useRef(null);
    const gamehome2 = useRef(null);
    const gamespawn3 = useRef(null);
    const gamehome3 = useRef(null);
    const [isCanvasEnabled,setIsCanvasEnabled] = useState(false);

    const sendCanvasData = () => {
        //if(isCanvasEnabled){
        //    let canvasData = canvasEl.current?.getSaveData();
        //    props.socketauth.emit('canvasData', {canvasSaveData:canvasData, roomid:window.location.pathname.substr(6)}, (resp) => {
                //console.log(resp);
                //setRoomlist(resp);
        //  });
       // }
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
        //get word and timer info for non drawing clients
        props.socketauth.on('clientdrawdata', data => {
            //nastavi word
          //  setWord("guess it.");
          //  setIsCanvasEnabled(false);
           // canvasEl.current?.clear();
            //start timer
         //   start();
        });

        //time is up for guessing
        props.socketauth.on('gamestopguess_by_server', room => {
            setRoomInfo(room);
            alert("stop guessing its over.");
        });

        props.socketauth.on('room_gameover_by_server', data => {
            alert("winner is " + data.winner);
            setSomebodywon(true);
            console.log(data);
        });

       // props.socketauth.on('getSavedCanvasData', data => {
           // canvasEl.current?.loadSaveData(data.canvasSaveData,true);
       // });

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

    const handleDiceThrowClick = (event,roomid) => {
       event.preventDefault();
       alert(gameboard.current?.children.length);
    }

    const handleRoomLeaveClick = (event,roomid) => {
        props.socketauth.emit('leaveroom', {roomid: roomid}, (resp) => {
            history.push("/");
        });
    }

    const handleRoomStartdrawingClick = (event,roomid) => {
        event.preventDefault();
        props.socketauth.emit('startdrawing', {roomid: roomid}, (resp) => {
            if(resp !== null){
                //zacni odstevati 3 min
            //    start();
           //     canvasEl.current?.clear();
           //     setIsCanvasEnabled(true);
            //    setWord(resp.word);
            }else{
                alert("not your turn to draw.");
            }
        });
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
                        <Button onClick={(event) => handleDiceThrowClick(event,window.location.pathname.substr(6))} variant="contained" type='submit' color="primary">
                            Met kocke
                        </Button>
                    </div>
                    <div>
                    
                    </div>
                    <div style={{paddingTop:"20px"}}>
                            <Button onClick={(event) => handleRoomLeaveClick(event,window.location.pathname.substr(6))} variant="contained" type='submit' color="primary">
                                    Leave Room
                            </Button>
                    </div>
                    <div style={{paddingTop:"20px"}}>
                            <Button onClick={(event) => handleRoomStartdrawingClick(event,window.location.pathname.substr(6))} variant="contained" type='submit' color="primary">
                                    Start game
                            </Button>
                    </div>
                </div>
                <div className="Room-spawnarea">
                    <div ref={gamespawn0} className="Room-Gamespawn spawn0">
                        <div className="box">
                        </div>
                        <div className="box">
                        </div>
                        <div className="box">
                        </div>
                        <div className="box">
                        </div>
                    </div>
                    <div ref={gamespawn1} className="Room-Gamespawn spawn1">
                        <div className="box">
                        </div>
                        <div className="box">
                        </div>
                        <div className="box">
                        </div>
                        <div className="box">
                        </div>
                    </div>
                    <div ref={gamespawn2} className="Room-Gamespawn spawn2">
                        <div className="box">
                        </div>
                        <div className="box">
                        </div>
                        <div className="box">
                        </div>
                        <div className="box">
                        </div>
                    </div>
                    <div ref={gamespawn3} className="Room-Gamespawn spawn3">
                        <div className="box">
                        </div>
                        <div className="box">
                        </div>
                        <div className="box">
                        </div>
                        <div className="box">
                        </div>
                    </div>
                </div>
                <div ref={gameboard} className="Room-Gameboard">
                    <div className="box boxtop0">
                    </div>
                    <div className="box boxtop1">
                    </div>
                    <div className="box boxtop2">
                    </div>
                    <div className="box boxtop3">
                    </div>
                    <div className="box boxtop4">
                    </div>
                    <div className="box boxtop5">
                    </div>
                    <div className="box boxtop6">
                    </div>
                    <div className="box boxtop7">
                    </div>
                    <div className="box boxtop8">
                    </div>
                    <div className="box boxtop9">
                    </div>
                    <div className="box boxright0">
                    </div>
                    <div className="box boxright1">
                    </div>
                    <div className="box boxright2">
                    </div>
                    <div className="box boxright3">
                    </div>
                    <div className="box boxright4" onClick={(event) => handleDiceThrowClick(event,window.location.pathname.substr(6))}>
                    </div>
                    <div className="box boxright5">
                    </div>
                    <div className="box boxright6">
                    </div>
                    <div className="box boxright7">
                    </div>
                    <div className="box boxright8">
                    </div>
                    <div className="box boxright9">
                    </div>
                    <div className="box boxbottom0">
                    </div>
                    <div className="box boxbottom1">
                    </div>
                    <div className="box boxbottom2">
                    </div>
                    <div className="box boxbottom3">
                    </div>
                    <div className="box boxbottom4">
                    </div>
                    <div className="box boxbottom5">
                    </div>
                    <div className="box boxbottom6">
                    </div>
                    <div className="box boxbottom7">
                    </div>
                    <div className="box boxbottom8">
                    </div>
                    <div className="box boxbottom9">
                    </div>
                    <div className="box boxleft0">
                    </div>
                    <div className="box boxleft1">
                    </div>
                    <div className="box boxleft2">
                    </div>
                    <div className="box boxleft3">
                    </div>
                    <div className="box boxleft4">
                    </div>
                    <div className="box boxleft5">
                    </div>
                    <div className="box boxleft6">
                    </div>
                    <div className="box boxleft7">
                    </div>
                    <div className="box boxleft8">
                    </div>
                    <div className="box boxleft9">
                    </div>
                    <div className="home0 home00">
                    </div>
                    <div className="home0 home01">
                    </div>
                    <div className="home0 home02">
                    </div>
                    <div className="home0 home03">
                    </div>
                    <div className="home1 home10">
                    </div>
                    <div className="home1 home11">
                    </div>
                    <div className="home1 home12">
                    </div>
                    <div className="home1 home13">
                    </div>
                    <div className="home2 home20">
                    </div>
                    <div className="home2 home21">
                    </div>
                    <div className="home2 home22">
                    </div>
                    <div className="home2 home23">
                    </div>
                    <div className="home3 home30">
                    </div>
                    <div className="home3 home31">
                    </div>
                    <div className="home3 home32">
                    </div>
                    <div className="home3 home33">
                    </div>
                </div>
            </div>
        </div>
  );
}

export default Room;
