var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var http = require("http");
var socketio = require("socket.io");
var mongoose = require('mongoose');
var jwt = require('jsonwebtoken');

var indexRouter = require('./routes/index');
var usercontroller = require('./controllers/userController');

//JsonWebTokenSecret
const accessTokenSecret = 'jsonWebTokenWeakSecret';

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useUnifiedTopology', true);

//set up connection to database
var MongoDB = 'mongodb://127.0.0.1/vaja03';
mongoose.connect(MongoDB);
mongoose.Promise = global.Promise;
var db = mongoose.connection;

db.on('error', console.error.bind(console, 'mongoDB connection error:'));

var app = express();

const server = http.createServer(app);

const io = socketio(server, {
    cors:{
      origin: '*',
    }
});

var rooms = [];
var roomcounter = 0;

const possibleWords = ["chest","tornado","snowflake","lighthouse","fingernail","water gun","squidward"];

const getRoomIndexByID = (roomid) => {
    let rx = parseInt(roomid);
    let index = rooms.findIndex(elem => elem._id === rx);
    return index;
}

const getPlayerIndexByName = (roomid,decoded) => {
    let rx = parseInt(roomid);
    let index = rooms.findIndex(elem => elem._id === rx);
    let index2 = rooms[index].sockets.findIndex(elem => elem.username === decoded.username);
    
    return index2;
}

const createRoom = () => {
    /*
    var Sockets = [];
    let tmpsocket = {
        username:"",
        points:0
    }


    for (const [_, socket] of connectedsockets) {
        console.log(socket.username);
    }
    */

    rooms.push({ 
        _id: roomcounter,
        name: "room"+roomcounter,
        sockets: [],
        word:"",
        timestamp:0,
        nrofplayersguessed:0,
        indexsocketdrawing:0,
    });
    roomcounter++;
}

var dst;

const drawingstarttimer = (roomid) => {
    dst = setTimeout(() =>{

    //po koncanem timerju prestavim igralca na naslednjega
    let numOfPlayers = rooms[getRoomIndexByID(roomid)].sockets.length;
    if(rooms[getRoomIndexByID(roomid)].indexsocketdrawing + 1 < numOfPlayers) {
        rooms[getRoomIndexByID(roomid)].indexsocketdrawing = rooms[getRoomIndexByID(roomid)].indexsocketdrawing + 1;
    }else{
        rooms[getRoomIndexByID(roomid)].indexsocketdrawing = 0;
    }

    rooms[getRoomIndexByID(roomid)].word = "";
    rooms[getRoomIndexByID(roomid)].nrofplayersguessed = 0;

    authio.to('room'+roomid).emit('gamestopguess_by_server', rooms[getRoomIndexByID(roomid)]);

 }, 180000); 
}

const drawingstoptimer = () => {
    clearTimeout(dst);
}


//socketom nastavi poinsts na 0 ko se joinajo v room

const authio = io.of('/auth');

    io.on('connection', function(socket) {
        console.log('A user connected');
        //Whenever someone disconnects this piece of code executed
        socket.on('disconnect', function () {
            console.log('A user disconnected');
        });

        //handleRegistration
        socket.on("register", (req, resp) => {
            usercontroller.create(req,resp);
        });

        //handleLogin
        socket.on("login", (req, resp) => {
            usercontroller.login(req,resp);
        });

    });

    //After user is authenticated we use this namespace
    authio.use(async (socket, next) => {
        const token = socket.handshake.auth.jwt
        if (token == null) next(new Error('forbidden')); // if there isn't any token
    
        jwt.verify(token, accessTokenSecret, (err, decoded) => {
            if (err) {
                next(new Error('forbidden'));
            }else{
                socket._id = decoded._id;
                socket.username = decoded.username;
                next(); // pass the execution off to whatever request the client intended
            }
        });
      });

    authio.on('connection', function(socket) {
        console.log('A user connected2');
        //Whenever someone disconnects this piece of code executed
        socket.on('disconnect', function () {
            console.log('A user disconnected');
        });

        //console.log(socket.username);
        //var connectedClients = authio.sockets;
        //console.log(connectedClients);

        //to loop through sockets
        // loop through all sockets
        //for (const [_, socket] of authio.sockets) {
            // ...
        //    console.log(socket.username);

        //}

        //for (const [_, socket] of authio.sockets) {
            // ...
        //    console.log(socket.username);

        //}

        //handleProfile
        socket.on("profile", (req, resp) => {
            usercontroller.show(socket,resp);
        });

        //create new room
        socket.on("createroom", (req, resp) => {
            createRoom();
            resp(rooms);
        });

        //join room
        socket.on("joinroom", (req, resp) => {
                let tmpPlayer = {
                    _id:socket._id,
                    username:socket.username,
                    points:0,
                    isDrawing:false,
                    hasGuessed:false,
                    haswon:false,
                }
                
                socket.join("room"+req.roomid);
                rooms[getRoomIndexByID(req.roomid)].sockets.push(tmpPlayer);
                resp(rooms);
        });

        //leave room
        socket.on("leaveroom", (req, resp) => {
            let index = getPlayerIndexByName(req.roomid,socket);
            if(index>-1){
                rooms[getRoomIndexByID(req.roomid)].sockets.splice(index,1);
            }
            
            socket.leave("room"+req.roomid);
            
            //if last player left room delete that room
            if(rooms[getRoomIndexByID(req.roomid)].sockets.length === 0){
                rooms.splice(getRoomIndexByID(req.roomid),1);
            }

            resp("Successfully left the room.");
        });

        //sends updates about rooms
        setInterval(() =>{ 
            //sends data to frontpage about rooms
            authio.emit("frontpage_update_by_server", rooms);
            
            //sends data to separate rooms to know which players are in that room
            rooms.forEach((room) => {
                //TODO check if game is over in any of the rooms then send that update also
                //in that room update everyones database entry and announce winner.
                room.sockets.forEach((player) => {
                    if(player.points >= 300){
                        player.haswon = true;
                        room.sockets.forEach((player2) => {
                            usercontroller.update(player2,()=>{});
                            player2.haswon = false;
                            player2.hasGuessed = false;
                            player2.points = 0;
                        });

                        authio.to('room'+room._id).emit('room_gameover_by_server', {winner:player.username});
                        
                    }
                });

                authio.to('room'+room._id).emit('room_update_by_server', room);
            });

        }, 2000);

        //recieve message
        socket.on("message", (req, resp) => {

            let points = 180;
            if(req.message === rooms[getRoomIndexByID(req.roomid)].word){
                //drawingstoptimer();
                rooms[getRoomIndexByID(req.roomid)].nrofplayersguessed +=1;
                rooms[getRoomIndexByID(req.roomid)].sockets[getPlayerIndexByName(req.roomid,socket)].points += points - Math.floor((Date.now() - rooms[getRoomIndexByID(req.roomid)].timestamp)/1000);
                
                authio.to("room"+req.roomid).emit("userMessage",{username:socket.username,message:"guessed right."});

                //check if everyone guessed
                if(rooms[getRoomIndexByID(req.roomid)].nrofplayersguessed === rooms[getRoomIndexByID(req.roomid)].sockets.length-1){
                    drawingstoptimer();
                    //po koncanem ugibanju prestavim igralca na naslednjega
                    let numOfPlayers = rooms[getRoomIndexByID(req.roomid)].sockets.length;
                    if(rooms[getRoomIndexByID(req.roomid)].indexsocketdrawing + 1 < numOfPlayers) {
                        rooms[getRoomIndexByID(req.roomid)].indexsocketdrawing = rooms[getRoomIndexByID(req.roomid)].indexsocketdrawing + 1;
                    }else{
                        rooms[getRoomIndexByID(req.roomid)].indexsocketdrawing = 0;
                    }

                    rooms[getRoomIndexByID(req.roomid)].word = "";
                    rooms[getRoomIndexByID(req.roomid)].nrofplayersguessed = 0;

                    authio.to('room'+req.roomid).emit('gamestopguess_by_server', rooms[getRoomIndexByID(req.roomid)]);
                }

            }else{
                authio.to("room"+req.roomid).emit("userMessage",{username:socket.username,message:req.message});
            }
            resp("message emitted succesfully.");

        });

        //var drawingstoptimer;

        //get word and start drawing
        socket.on("startdrawing", (req, resp) => {
            let index = getPlayerIndexByName(req.roomid,socket);

            if(index === rooms[getRoomIndexByID(req.roomid)].indexsocketdrawing){
            
                //rooms[getRoomIndexByID(req.roomid)]
                let tmpword = possibleWords[Math.floor(Math.random() * 7)];
                rooms[getRoomIndexByID(req.roomid)].word = tmpword;
                rooms[getRoomIndexByID(req.roomid)].timestamp = Date.now();

                socket.to("room"+req.roomid).emit("clientdrawdata",{});

                drawingstarttimer(req.roomid);

                resp({
                    word:tmpword,
                });

            }else{
                resp(null);
            }
        });

        //receive canvas data from socket that is drawing
        socket.on("canvasData", (req, resp) => {
            socket.to("room"+req.roomid).emit("getSavedCanvasData",{canvasSaveData:req.canvasSaveData});

            resp("message emitted succesfully.");
        });

    });



app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

// Catch 404 and forward to error handler 
app.use(function (req, res, next) { 
    next(createError(404)); 
}); 
  
// Error handler 
app.use(function (err, req, res, next) { 
  
    // Set locals, only providing error 
    // in development 
    res.locals.message = err.message; 
    res.locals.error = req.app.get('env')  
            === 'development' ? err : {}; 
  
    // render the error page 
    res.status(err.status || 500); 
    res.render('error'); 
}); 
  
module.exports = { app: app, server: server }; 
