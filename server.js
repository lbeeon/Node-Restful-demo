// =======================
// get the packages we need ============
// =======================
var express     = require('express');
var app         = express();
var bodyParser  = require('body-parser');
var morgan      = require('morgan');
var mongoose    = require('mongoose');

var jwt    = require('jsonwebtoken'); // used to create, sign, and verify tokens
var config = require('./config'); // get our config file
var User   = require('./app/models/user'); // get our mongoose model
    
// =======================
// configuration =========
// =======================
var port = process.env.PORT || 8080; // used to create, sign, and verify tokens
mongoose.connect(config.database); // connect to database
app.set('superSecret', config.secret); // secret variable

// use body parser so we can get info from POST and/or URL parameters
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// use morgan to log requests to the console
app.use(morgan('dev'));

// =======================
// routes ================
// =======================
// basic route
app.get('/', function(req, res) {
    res.send('Hello! The API is at http://localhost:' + port + '/api');
});

app.get('/setup', function(req, res) {

  // create a sample user
  var nUser = 
  [
	new User({ 
			id: "A123456789",
			name: 'Nick Cerminara', 
			password: 'password',
			admin: true 
	}),
	new User({ 
			id: "B123456789",
			name: 'Nick Son', 
			password: 'password',
			admin: true 
	})
  ];
  

  // save the sample user
  for(var i=0; i<nUser.length; i++){
	  nUser[i].save(function(err){
		  if(err) throw err;
	  });
    res.json({ success: true });
	  
  }
});

// route read all user (GET)
app.get('/users', function(req, res){
  User.find({}, function(err, users) {
    res.json(users);
  });
});

// route read by id (GET)
app.get('/users/:id', function(req, res){
	var id = req.params.id;
    console.log('id: ' + id);
	var query = { "id": id};
	User.find(query, function(err, user){
		res.json(user);
	});
});

// route to insert user (POST)
app.post('/users', function(req, res){
	if(req.body == 0){
		return res.status(403).send({
			success: false,
			message: 'Invaild access'
		});
	}
	var Insert = new User(req.body);
	Insert.save(function(err){
		if(err) throw err;
		res.json({ success: true });
	});
});

// route update user (PUT)
app.put('/users/:id', function(req, res){
	var id = req.params.id;
	var query = { "id": id};
	console.log(req.body);
	if(req.body.length == 0) {
		return res.status(403).send({
			success: false,
			message: 'Invaild access'
		});
	}

	var UpdateUser = req.body;

	User.update(query, UpdateUser,{ multi: true }, function(err, updated){
		if(err) throw err;
		console.dir(updated);
		return res.json({
          success: true,
          message: 'Update Success!!'
        });
	});
});

// route delete user (DELETE)
app.delete('/users/:id', function(req, res){
	var id = req.params.id;
	if(!id){
		return res.status(403).send({
			success: false,
			message: 'Invaild access'
		});
	}
	var query = { "id": id};
	User.remove(query, function(err){
		if(err) throw err;
		console.log("Delete Success!!")
		res.json({
          success: true,
          message: 'Delete Success!!'
		});
	});
});

// API ROUTES -------------------
// get an instance of the router for api routes
var apiRoutes = express.Router(); 

// route to authenticate a user (POST http://localhost:8080/api/authenticate)
apiRoutes.post('/authenticate', function(req, res) {

  // find the user
  User.findOne({
    name: req.body.name
  }, function(err, user) {

    if (err) throw err;

    if (!user) {
      res.json({ success: false, message: 'Authentication failed. User not found.' });
    } else if (user) {

      // check if password matches
      if (user.password != req.body.password) {
        res.json({ success: false, message: 'Authentication failed. Wrong password.' });
      } else {

        // if user is found and password is right
        // create a token
        var token = jwt.sign(user, app.get('superSecret'), {
          expiresInMinutes: 1440 // expires in 24 hours
        });

        // return the information including token as JSON
        res.json({
          success: true,
          message: 'Enjoy your token!',
          token: token
        });
      }   

    }

  });
});

// route middleware to verify a token
apiRoutes.use(function(req, res, next) {

  // check header or url parameters or post parameters for token
  var token = req.body.token || req.query.token || req.headers['x-access-token'];

  // decode token
  if (token) {

    // verifies secret and checks exp
    jwt.verify(token, app.get('superSecret'), function(err, decoded) {      
      if (err) {
        return res.json({ success: false, message: 'Failed to authenticate token.' });    
      } else {
        // if everything is good, save to request for use in other routes
        req.decoded = decoded;    
        next();
      }
    });

  } else {

    // if there is no token
    // return an error
    return res.status(403).send({ 
        success: false, 
        message: 'No token provided.' 
    });
    
  }
});

// route to show a random message (GET http://localhost:8080/api/)
apiRoutes.get('/', function(req, res) {
  res.json({ message: 'Welcome to the coolest API on earth!' });
});

// route to return all users with token (GET http://localhost:8080/api/users)
apiRoutes.get('/users', function(req, res) {
  User.find({}, function(err, users) {
    res.json(users);
  });
});   

// route read by id with token (GET)
apiRoutes.get('/users/:id', function(req, res){
	var id = req.params.id;
    console.log('id: ' + id);
	var query = { "id": id};
	User.find(query, function(err, user){
		res.json(user);
	});
});

// route to insert user with token (POST)
apiRoutes.post('/users', function(req, res){
	if(req.body == 0){
		return res.status(403).send({
			success: false,
			message: 'Invaild access'
		});
	}
	var Insert = new User(req.body);
	Insert.save(function(err){
		if(err) throw err;
		res.json({ success: true });
	});
});

// route update user with token (PUT)
apiRoutes.put('/users/:id', function(req, res){
	var id = req.params.id;
	var query = { "id": id};
	console.log(req.body);
	if(req.body.length == 0) {
		return res.status(403).send({
			success: false,
			message: 'Invaild access'
		});
	}

	var UpdateUser = req.body;

	User.update(query, UpdateUser,{ multi: true }, function(err, updated){
		if(err) throw err;
		console.dir(updated);
		return res.json({
          success: true,
          message: 'Update Success!!'
        });
	});
});

// route delete user with token (DELETE)
apiRoutes.delete('/users/:id', function(req, res){
	var id = req.params.id;
	if(!id){
		return res.status(403).send({
			success: false,
			message: 'Invaild access'
		});
	}
	var query = { "id": id};
	User.remove(query, function(err){
		if(err) throw err;
		console.log("Delete Success!!")
		res.json({
          success: true,
          message: 'Delete Success!!'
		});
	});
});

// apply the routes to our application with the prefix /api
app.use('/api', apiRoutes);

// =======================
// start the server ======
// =======================
app.listen(port);
console.log('Magic happens at http://localhost:' + port);