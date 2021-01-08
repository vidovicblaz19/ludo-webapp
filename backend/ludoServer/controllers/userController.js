var userModel = require('../models/userModel.js');
var jwt = require('jsonwebtoken');
const accessTokenSecret = 'jsonWebTokenWeakSecret';

/**
 * userController.js
 *
 * @description :: Server-side logic for managing users.
 */
module.exports = {

    /**
     * userController.list()
     */
    list: function (req, res) {
        userModel.find(function (err, users) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when getting user.',
                    error: err
                });
            }
            return res.json(users);
        });
    },

    /**
     * userController.show()
     */
    show: (req, res) => {
        var id = req._id;
        userModel.findOne({_id: id}, function (err, user) {
            if (err) {
                return res({
                    message: 'Error when getting user.',
                    error: err
                });
            }
            if (!user) {
                return res({
                    message: 'No such user'
                });
            }
            return res(user);
        });
    },

    /**
     * userController.create()
     */
    create: (req, res) => {        
        var user = new userModel({
			username : req.username,
			password : req.password,
			nrofgames : 0,
			wins : 0,
            secondplace : 0,
            thirdplace : 0,
            fourthplace : 0
        });

        user.save(function (err, user) {
            if (err) {
                return res('Error creating user.');
            }
            return res('User created successfully.');
        });
        
    },

    /**
     * userController.login()
     */
    login: (req, res) => {
        userModel.authenticate(req.username, req.password, function (error, user) {
        if (error || !user) {
          res({
            message: "Wrong username or password.",
            jwt:undefined,
        });
        } else {
            //user is authenticated so give him jwt
            const accessToken = jwt.sign({_id:user._id, username: user.username},accessTokenSecret);
          res({
              message: "Successful Login",
              jwt:accessToken,
          });
        }
      });
    },


    /**
     * userController.update()
     */
    update: (req, res) => {
        var id = req._id;
        var points = req.points;
        var haswon = req.haswon;
        userModel.findOne({_id: id}, function (err, user) {
            if (err) {
                return res({
                    message: 'Error when getting user.',
                    error: err
                });
            }
            if (!user) {
                return res({
                    message: 'No such user'
                });
            }

            //pristej k vsem igram
            user.nrofgames = user.nrofgames + 1;
            if(haswon){
            user.wins += 1;
            }
			user.secondplace = user.secondplace + 1;
            user.thirdplace = user.thirdplace + 1;
            user.fourthplace = user.thirdplace + 1;
			
            user.save(function (err, user) {
                if (err) {
                    return res({
                        message: 'Error when updating user.',
                        error: err
                    });
                }

                return res(user);
            });
        });
    },

    /**
     * userController.remove()
     */
    remove: function (req, res) {
        var id = req.params.id;
        userModel.findByIdAndRemove(id, function (err, user) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when deleting the user.',
                    error: err
                });
            }
            return res.status(204).json();
        });
    }
};
