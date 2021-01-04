import React, { Component } from 'react';
import Button from '@material-ui/core/Button';
import {Link} from 'react-router-dom';

function Unauthorized() {
  return (
    <div className="Frontpage">
      <h3>Error user unauthorized.</h3>
      <div>
        <Link to='/register'>
          <Button variant="contained" color="primary">
              Register
          </Button>
          </Link>
      </div>
      <div>
        <Link to='/login'>
          <Button variant="contained" color="primary">
              Login
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default Unauthorized;
