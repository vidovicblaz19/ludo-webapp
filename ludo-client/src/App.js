import React, { useState, useEffect } from 'react';
import './App.css';
import { BrowserRouter, Route, Switch, useHistory } from 'react-router-dom';
import Frontpage from './Frontpage';
import JWTFrontpage from './JWTFrontpage';
import Register from './Register';
import Login from './Login';
import Profile from  './Profile';
import Unauthorized from './Unauthorized';
import Room from './Room';
import { io } from 'socket.io-client';
import jwt from 'jsonwebtoken';
const ENDPOINT = "http://127.0.0.1:4000";
const ENDPOINTAUTH = "http://127.0.0.1:4000/auth";
var socket = io(ENDPOINT);
var socketauth = null;
const jwtToken = localStorage.getItem('jwt');
//JsonWebTokenSecret
const accessTokenSecret = 'jsonWebTokenWeakSecret';

const  authenticateJWT = () => {
  // Gather the jwt access token from the request header
  if (jwtToken == null) return false; // if there isn't any token
  let decodedjwt;
  try {
    decodedjwt = jwt.verify(jwtToken, accessTokenSecret);
  } catch(err) {
    return false;
  }
    return true;
}

if(authenticateJWT()){
  socketauth = io(ENDPOINTAUTH, {
    auth: {
      jwt: jwtToken,
    }
  });
}

function App() {
  //const [jwtToken,setJwtToken] = useState();
  let history = useHistory();

  useEffect(() => {

  },[]);

  const handleRegisterSubmitUserData = (event,user) => {
    event.preventDefault();
    const User = {
      username: user.username,
      password: user.password
    };
    socket.emit('register', User, (resp) => {
      alert(resp);
      history.push("/");
    });
  }

  const handleLoginSubmitUserData = (event,user) => {
    event.preventDefault();
    const User = {
      username: user.username,
      password: user.password
    };
    socket.emit('login', User, (resp) => {
      if(resp.jwt == null){
        alert("Login failed.")
      }else{
        alert("Login successful.")
        localStorage.setItem('jwt', resp.jwt);
        socketauth = io(ENDPOINTAUTH);
        history.push("/");
      }
    });
  }

  const FrontpageComponent = () => {
    return (
      <React.Fragment>
      <Frontpage/>
      </React.Fragment>
    );
  }

  const JWTFrontpageComponent = () => {
    return (
      <React.Fragment>
      <JWTFrontpage socketauth={socketauth}/>
      </React.Fragment>
    );
  }

  const ProfileComponent = () => {
    return (
      <React.Fragment>
      <Profile socketauth={socketauth}/>
      </React.Fragment>
    );
  }

  const UnauthorizedComponent = () => {
    return (
      <React.Fragment>
      <Unauthorized/>
      </React.Fragment>
    );
  }

  const RegisterComponent = () => {
    return (
      <React.Fragment>
      <Register handleRegisterSubmitUserData={(event,user) => handleRegisterSubmitUserData(event, user)}/>
      </React.Fragment>
    );
  }

  const LoginComponent = () => {
    return (
      <React.Fragment>
      <Login handleLoginSubmitUserData={(event,user) => handleLoginSubmitUserData(event, user)}/>
      </React.Fragment>
    );
  }

  const RoomComponent = () => {
    return (
      <React.Fragment>
      <Room socketauth={socketauth} />
      </React.Fragment>
    );
  }

  const SecureRoute = (props) => {
    if(authenticateJWT()){
      //user has valid jwt
      return(
        <Route path={props.path} component={props.JWTcomponent}/>
      );
    }else{  //no valid jwt
      return(
        <Route path={props.path} component={props.component}/>
        
      );
    }
  }

  return (
    <div className="App">
        <Switch>
          <SecureRoute path="/" JWTcomponent={JWTFrontpageComponent} component={FrontpageComponent} exact/>
          <Route path="/login" component={LoginComponent} />
          <Route path="/register" component={RegisterComponent} />
          <SecureRoute path="/profile" JWTcomponent={ProfileComponent} component={UnauthorizedComponent} />
          <SecureRoute path="/room" JWTcomponent={RoomComponent} component={UnauthorizedComponent} />
        </Switch>
    </div>
  );
}

export default App;
