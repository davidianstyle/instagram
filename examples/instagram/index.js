// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var https = require('https');
var querystring = require('querystring');
var io = require('../..')(server);
var port = process.env.PORT || 3000;

server.listen(port, function () {
    console.log('Server listening at port %d', port);
});

// Express app logging
app.use(function(req, res, next){
    console.log('%s %s', req.method, req.url);
    next();
});

// Routing
app.use(express.static(__dirname + '/public'));

// Chatroom
var numUsers = 0;

// Instagram Data
var getInstagramData = function() {
    var instagramData = {
	clientId: '74a89daa585c4b139e84a615d8991662',
	clientSecret: 'ba6dce6ef0bb4ee9b5b4a3bbaa650345',
	redirectURI: 'http://davidianstyle.ddns.net:3000/instagram',
	accessToken: '215392349.5f5f2cb.5c72b8ba42544d7b9c98fc8c457944f3'
    };

    return instagramData;
}

// User login to get auth code
app.use('/authcode', function(request, response) {
    response.send(getAuthCode());
});
var getAuthCode = function() {
    console.log('getAuthCode');

    var data = getInstagramData();
    
    // Request the following URL to get the instagramAuthCode
    var authCodeQueryParams = {
	client_id: data.clientId,
	redirect_uri: data.redirectURI,
	response_type: 'code'
    };

    return authCodeQueryParams;
}

// Use auth code to get access token
app.use('/instagram', function(request, response) {
    getAccessToken(request.query.code);
});
var getAccessTokenCallback = function(response) {
    console.log(Object.keys(response));
    console.log(response.statusCode);
    console.log(response.statusMessage);

    var data = getInstagramData();

    // Save access token
    data.accessToken = response.access_token;
    data.user = response.user;
}
var getAccessToken = function(authCode) {
    console.log('getAccessToken');

    var data = getInstagramData();

    var accessTokenQueryParams = {
	client_id: data.clientId,
	client_secret: data.clientSecret,
	grant_type: 'authorization_code',
	redirect_uri: data.redirectURI,
	code: authCode
    };
    var options = {
	host: 'api.instagram.com',
	path: '/oauth/access_token?' + querystring.stringify(accessTokenQueryParams),
	method: 'POST'
    };
    console.log('https://' + options.host + options.path);
    https.request(options, getAccessTokenCallback).end();
}

io.on('connection', function (socket) {
    var addedUser = false;

    var data = getInstagramData();
    // when the client emits 'add hashtag', this listens and executes
    socket.on('add hashtag', function (username) {
	console.log('new hashtag: ' + username);
	var tagSearchCallback = function(response) {
	    console.log(response);
	};
	var options = {
	    host: 'api.instagram.com',
	    path: '/v1/tags/' + username + '/media/recent?access_token=' + data.accessToken,
	};
	https.request(options, tagSearchCallback).end();
	if (addedUser) return;

	// we store the username in the socket session for this client
	socket.username = username;
	++numUsers;
	addedUser = true;
	socket.emit('login', {
	    numUsers: numUsers
	});
	// echo globally (all clients) that a person has connected
	socket.broadcast.emit('user joined', {
	    username: socket.username,
	    numUsers: numUsers
	});
    });

    // when the user disconnects.. perform this
    socket.on('disconnect', function () {
	if (addedUser) {
	    --numUsers;

	    // echo globally that this client has left
	    socket.broadcast.emit('user left', {
		username: socket.username,
		numUsers: numUsers
	    });
	}
    });

    // Poll for new images from Instagram
    setTimeout(function(){
	socket.broadcast.emit('token received', {
	})
    }, 1000);
});
