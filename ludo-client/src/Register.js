
import React, { useState  } from 'react';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import {useHistory } from 'react-router-dom';

function Register(props) {
    const [usernameInput, setUsernameInput] = useState("");
    const [passwordInput, setPasswordInput] = useState("");
    let history = useHistory();

    const handleUserNameChange = (event) => {
        setUsernameInput(event.target.value);
    }
    const handlePasswordChange = (event) => {
        setPasswordInput(event.target.value);
    }

    const handleSubmit = (event) => {
        props.handleRegisterSubmitUserData(event,{username:usernameInput,
        password:passwordInput });
    }

    const handleClickBack = (event) => {
        event.preventDefault();
        history.push("/");
    }

  return (
    <form onSubmit={handleSubmit} noValidate autoComplete="off">
        <div className="Register">
            <h2>Registriraj se:</h2>
            <div>
                <TextField className='TextField' placeholder="Uporabniško ime" onChange={handleUserNameChange} id="Username" variant="outlined" />
            </div>
            <div>
                <TextField className='TextField' type="password" placeholder="Geslo" onChange={handlePasswordChange} id="Username" variant="outlined" />
            </div>
            <div>
                <Button variant="contained" type='submit' color="primary">
                    Pošlji
                </Button>
                <Button onClick={((event) => handleClickBack(event))} variant="contained" type='submit' color="primary">
                    Nazaj
                </Button>
            </div>
        </div>
    </form>
  );
}

export default Register;
