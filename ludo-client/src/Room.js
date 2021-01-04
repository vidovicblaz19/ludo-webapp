
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
    const canvasEl = useRef(null);
    const [isCanvasEnabled,setIsCanvasEnabled] = useState(false);

    const sendCanvasData = () => {
        if(isCanvasEnabled){
            let canvasData = canvasEl.current?.getSaveData();
            props.socketauth.emit('canvasData', {canvasSaveData:canvasData, roomid:window.location.pathname.substr(6)}, (resp) => {
                //console.log(resp);
                //setRoomlist(resp);
          });
        }
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
            setWord("guess it.");
            setIsCanvasEnabled(false);
            canvasEl.current?.clear();
            //start timer
            start();
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

        props.socketauth.on('getSavedCanvasData', data => {
            canvasEl.current?.loadSaveData(data.canvasSaveData,true);
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
                start();
                canvasEl.current?.clear();
                setIsCanvasEnabled(true);
                setWord(resp.word);
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
                    <div>
                    <Paper elevation={2}>
                <h3 style={{padding:"6px"}} >Word: {word}</h3>
                    </Paper>
                    </div>
                    <div>
                    <Paper elevation={2}>
                <h3 style={{padding:"6px"}}>Time: {timeLeft/1000}</h3>
                    </Paper>
                    </div>
                    <div style={{paddingTop:"20px"}}>
                            <Button onClick={(event) => handleRoomLeaveClick(event,window.location.pathname.substr(6))} variant="contained" type='submit' color="primary">
                                    Leave Room
                            </Button>
                    </div>
                    <div style={{paddingTop:"20px"}}>
                            <Button onClick={(event) => handleRoomStartdrawingClick(event,window.location.pathname.substr(6))} variant="contained" type='submit' color="primary">
                                    Start drawing
                            </Button>
                    </div>
                </div>
                <div className="Room-Canvas">
                    <div>
                    <CanvasDraw onChange={sendCanvasData} disabled={!isCanvasEnabled} ref={canvasEl} hideGrid={true} canvasWidth={600} canvasHeight={600}/>
                    </div>
                </div>
            </div>
        </div>
  );
}

export default Room;
