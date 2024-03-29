var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var Schema   = mongoose.Schema;

var userSchema = new Schema({
	'username' : String,
	'password' : String,
	'nrofgames' : Number,
	'wins' : Number,
	'secondplace' : Number,
	'thirdplace' : Number,
	'fourthplace' : Number
});

//authenticate input against database
userSchema.statics.authenticate = function (username, password, callback) {
	var user = mongoose.model('user', userSchema);
	user.findOne({ username: username })
	  .exec(function (err, user) {
		if (err) {
		  return callback(err)
		} else if (!user) {
		  var err = new Error('User not found.');
		  err.status = 401;
		  return callback(err);
		}
		bcrypt.compare(password, user.password, function (err, result) {
		  if (result === true) {
			return callback(null, user);
		  } else {
			return callback();
		  }
		});
	  });
  }

//hashing a password before saving it to the database
userSchema.pre('save', function (next) {
	var user = this;
	bcrypt.hash(user.password, 10, function (err, hash) {
	  if (err) {
		return next(err);
	  }
	  user.password = hash;
	  next();
	});
  });

module.exports = mongoose.model('user', userSchema);
