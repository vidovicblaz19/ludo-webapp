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

const createRoom = () => {
    rooms.push({ 
        _id: roomcounter,
        name: "room"+roomcounter,
        sockets: [],
        indexsocketturn:0,
        socketturnstage:0,
        gameactive:false,
        spawn0:[initLudoObj(0,0),initLudoObj(0,1),initLudoObj(0,2),initLudoObj(0,3)],
        spawn1:[initLudoObj(1,0),initLudoObj(1,1),initLudoObj(1,2),initLudoObj(1,3)],
        spawn2:[initLudoObj(2,0),initLudoObj(2,1),initLudoObj(2,2),initLudoObj(2,3)],
        spawn3:[initLudoObj(3,0),initLudoObj(3,1),initLudoObj(3,2),initLudoObj(3,3)],
        field:[initLudoObjField(),initLudoObjField(),initLudoObjField(),initLudoObjField(),initLudoObjField(),initLudoObjField(),initLudoObjField(),initLudoObjField(),initLudoObjField(),initLudoObjField(),initLudoObjField(),initLudoObjField(),initLudoObjField(),initLudoObjField(),initLudoObjField(),initLudoObjField(),initLudoObjField(),initLudoObjField(),initLudoObjField(),initLudoObjField(),initLudoObjField(),initLudoObjField(),initLudoObjField(),initLudoObjField(),initLudoObjField(),initLudoObjField(),initLudoObjField(),initLudoObjField(),initLudoObjField(),initLudoObjField(),initLudoObjField(),initLudoObjField(),initLudoObjField(),initLudoObjField(),initLudoObjField(),initLudoObjField(),initLudoObjField(),initLudoObjField(),initLudoObjField(),initLudoObjField()],
        safe0:[initLudoObj(0,0),initLudoObj(0,1),initLudoObj(0,2),initLudoObj(0,3)],
        safe1:[initLudoObj(1,0),initLudoObj(1,1),initLudoObj(1,2),initLudoObj(1,3)],
        safe2:[initLudoObj(2,0),initLudoObj(2,1),initLudoObj(2,2),initLudoObj(2,3)],
        safe3:[initLudoObj(3,0),initLudoObj(3,1),initLudoObj(3,2),initLudoObj(3,3)],
        currDiceRoll:0,
    });
    roomcounter++;
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
                authio.to('room'+room._id).emit('room_update_by_server', room);
            });

        }, 500);

        //recieve message
        socket.on("message", (req, resp) => {
            authio.to("room"+req.roomid).emit("userMessage",{username:socket.username,message:req.message});
            resp("message emitted succesfully.");
        });

        //start game
        socket.on("startgame", (req, resp) => {
            let index = getPlayerIndexByName(req.roomid,socket);

            if(index === rooms[getRoomIndexByID(req.roomid)].indexsocketturn){
                //give players gamepieces
                startingGamePieces(rooms[getRoomIndexByID(req.roomid)]);

                resp(rooms[getRoomIndexByID(req.roomid)]);
            }else{
                resp(null);
            }
        });

        //throw dice
        socket.on("throwdice", (req, resp) => {
            let index = getPlayerIndexByName(req.roomid,socket);
            let room = rooms[getRoomIndexByID(req.roomid)];

            if(index === room.indexsocketturn){
                if(room.socketturnstage === 0){
                    room.currDiceRoll = Math.floor((Math.random() * 6) + 1);
                    room.socketturnstage = 1;
                    //if every gamepiece is in spawn
                    let piecesinspawn = 0;
                    if(room.indexsocketturn === 0){
                        room.spawn0.forEach((spawnpiece) => {
                            if(spawnpiece.active){piecesinspawn++;}
                        });
                    }else if(room.indexsocketturn === 1){
                        room.spawn1.forEach((spawnpiece) => {
                            if(spawnpiece.active){piecesinspawn++;}
                        });
                    }else if(room.indexsocketturn === 2){
                        room.spawn2.forEach((spawnpiece) => {
                            if(spawnpiece.active){piecesinspawn++;}
                        });
                    }else if(room.indexsocketturn === 3){
                        room.spawn3.forEach((spawnpiece) => {
                            if(spawnpiece.active){piecesinspawn++;}
                        });
                    }
                    //if all pieces in spawn go to next person
                    if(piecesinspawn === 4 && room.currDiceRoll !== 6){
                        room.socketturnstage = 0;
                        nextplayer(room);
                    }
                }

                resp(room);
            }else{
                resp(null);
            }
        });

        //move from spawn
        socket.on("spawnmove", (req, resp) => {
            let color = req.color;
            let spawnindex = req.index;
            
            let index = getPlayerIndexByName(req.roomid,socket);
            let room = rooms[getRoomIndexByID(req.roomid)];

            //check if clicked on field with a gamepiece
            let haspiece = false;
            if(color === 0){
                if(room.spawn0[spawnindex].active) haspiece=true; 
            }else if(color === 1){
                if(room.spawn1[spawnindex].active) haspiece=true; 
            }else if(color === 2){
                if(room.spawn2[spawnindex].active) haspiece=true; 
            }else if(color === 3){
                if(room.spawn3[spawnindex].active) haspiece=true; 
            }

            if(index === room.indexsocketturn && index === color && room.currDiceRoll === 6 && haspiece){
                if(room.socketturnstage === 1){
                    //clicked game piece remove from spawn,
                    spawnMoveOut(room,color,spawnindex);
                    room.socketturnstage = 0;
                    nextplayer(room);
                }

                resp(room);
            }else{
                resp(null);
            }
            
        });

        //move piece on the field
        socket.on("fieldmove", (req, resp) => {
            let fieldindex = req.index;
            
            let index = getPlayerIndexByName(req.roomid,socket);
            let room = rooms[getRoomIndexByID(req.roomid)];

            //check if clicked on field with a gamepiece
            let haspiece = false;
            if(room.field[fieldindex].active) haspiece=true; 

            if(index === room.indexsocketturn && index === room.field[fieldindex].color && haspiece){
                if(room.socketturnstage === 1){
                    //clicked game piece move forward on the field,
                    movePieceOnField(room,fieldindex);
                    room.socketturnstage = 0;
                    nextplayer(room);
                }

                resp(room);
            }else{
                resp(null);
            }
            
        });

    });

const nextplayer = (room) => {
    let tmp = room.indexsocketturn + 1;
    room.indexsocketturn = tmp % room.sockets.length;
}

const movePieceOnField = (room,index) => {

    let moveaction = (index+room.currDiceRoll)%40;
    
    //if field has a piece on it, it gets thrown back to the spawn
    if(room.field[moveaction].active){
        if(room.field[moveaction].color === 0){
            room.spawn0[room.field[moveaction].index].active = true;
        }else if(room.field[moveaction].color === 1){
            room.spawn1[room.field[moveaction].index].active = true;
        }else if(room.field[moveaction].color === 2){
            room.spawn2[room.field[moveaction].index].active = true;
        }else if(room.field[moveaction].color === 3){
            room.spawn3[room.field[moveaction].index].active = true;
        }
    }

    //check if we can go in safehouse
    let safehouseIndex = 0;
    let goToSafeHouse = false;
    if(room.field[index].color === 0){
        if(index+room.currDiceRoll > 39 && index <= 39){
            safehouseIndex = room.currDiceRoll + index - 39 - 1;
            goToSafeHouse = true;
            room.safe0[safehouseIndex] = Object.assign({}, room.field[index]);
            room.field[index].active = false;
        }
    }else if(room.field[index].color === 1){
        if(index+room.currDiceRoll > 9 && index <= 9){
            safehouseIndex = room.currDiceRoll + index - 9 - 1;
            goToSafeHouse = true;
            room.safe1[safehouseIndex] = Object.assign({}, room.field[index]);
            room.field[index].active = false;
        }
    }else if(room.field[index].color === 2){
        if(index+room.currDiceRoll > 19 && index <= 19){
            safehouseIndex = room.currDiceRoll + index - 19 - 1;
            goToSafeHouse = true;
            room.safe2[safehouseIndex] = Object.assign({}, room.field[index]);
            room.field[index].active = false;
        }
    }else if(room.field[index].color === 3){
        if(index+room.currDiceRoll > 29 && index <= 29){
            safehouseIndex = room.currDiceRoll + index - 29 - 1;
            goToSafeHouse = true;
            room.safe3[safehouseIndex] = Object.assign({}, room.field[index]);
            room.field[index].active = false;
        }
    }

    //else move gamepiece forward
    if(!goToSafeHouse){
        room.field[moveaction] = Object.assign({}, room.field[index]);
        room.field[index].active = false;
    }
}

const spawnMoveOut = (room,color,index) => {

    if(room.currDiceRoll === 6){
        let coloroffset = color * 10;
        //if field has a piece on it, it gets thrown back to the spawn
        if(room.field[coloroffset].active){
            if(room.field[coloroffset].color === 0){
                room.spawn0[room.field[coloroffset].index].active = true;
            }else if(room.field[coloroffset].color === 1){
                room.spawn1[room.field[coloroffset].index].active = true;
            }else if(room.field[coloroffset].color === 2){
                room.spawn2[room.field[coloroffset].index].active = true;
            }else if(room.field[coloroffset].color === 3){
                room.spawn3[room.field[coloroffset].index].active = true;
            }
        }

        //moves gamepiece to the gameboard, then removes gamepiece from spawn
        if(color === 0){
            room.field[coloroffset] = Object.assign({}, room.spawn0[index]);
            room.spawn0[index].active = false;
        }else if(color === 1){
            room.field[coloroffset] = Object.assign({}, room.spawn1[index]);
            room.spawn1[index].active = false;
        }else if(color === 2){
            room.field[coloroffset] = Object.assign({}, room.spawn2[index]);
            room.spawn2[index].active = false;
        }else if(color === 3){
            room.field[coloroffset] = Object.assign({}, room.spawn3[index]);
            room.spawn3[index].active = false;
        }
    }
}


const startingGamePieces = (room) => {
    if(!room.gameactive){
        //if blue
        if(room.sockets.length >= 1){
            room.spawn0.forEach((gamepiece) => {
                gamepiece.active = true;
            });
        }
        //if red
        if(room.sockets.length >= 2){
            room.spawn1.forEach((gamepiece) => {
                gamepiece.active = true;
            });
        }
        //if yellow
        if(room.sockets.length >= 3){
            room.spawn2.forEach((gamepiece) => {
                gamepiece.active = true;
            });
        }
        //if green
        if(room.sockets.length === 4){
            room.spawn3.forEach((gamepiece) => {
                gamepiece.active = true;
            });
        }
        room.gameactive = true;
    }
}


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
