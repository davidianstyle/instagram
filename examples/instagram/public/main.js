$(function() {
    var FADE_TIME = 150; // ms
    var TYPING_TIMER_LENGTH = 400; // ms
    var COLORS = [
	'#e21400', '#91580f', '#f8a700', '#f78b00',
	'#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
	'#3b88eb', '#3824aa', '#a700ff', '#d300e7'
    ];

    // Initialize variables
    var $window = $(window);
    var $usernameInput = $('.usernameInput'); // Input for username
    var $messages = $('.messages'); // Messages area

    var $loginPage = $('.login.page'); // The login page
    var $picturePage = $('.picture.page'); // The pictureroom page

    // Connection
    var username;
    var connected = false;
    var socket = io();

    // Sets the client's username
    function setUsername () {
	username = cleanInput($usernameInput.val().trim());

	// If the username is valid
	if (username) {
	    $loginPage.fadeOut();
	    $picturePage.show();
	    $loginPage.off('click');

	    // Tell the server your username
	    socket.emit('add hashtag', username);
	}
    }

    // Gets the color of a username through our hash function
    function getUsernameColor (username) {
	// Compute hash code
	var hash = 7;
	for (var i = 0; i < username.length; i++) {
	    hash = username.charCodeAt(i) + (hash << 5) - hash;
	}
	// Calculate color
	var index = Math.abs(hash % COLORS.length);
	return COLORS[index];
    }

    // Log a message
    function log (message, options) {
	var $el = $('<li>').addClass('log').text(message);
	addMessageElement($el, options);
    }

    // Adds a message element to the messages and scrolls to the bottom
    // el - The element to add as a message
    // options.fade - If the element should fade-in (default = true)
    // options.prepend - If the element should prepend
    //   all other messages (default = false)
    function addMessageElement (el, options) {
	var $el = $(el);

	// Setup default options
	if (!options) {
	    options = {};
	}
	if (typeof options.fade === 'undefined') {
	    options.fade = true;
	}
	if (typeof options.prepend === 'undefined') {
	    options.prepend = false;
	}

	// Apply options
	if (options.fade) {
	    $el.hide().fadeIn(FADE_TIME);
	}
	if (options.prepend) {
	    $messages.prepend($el);
	} else {
	    $messages.append($el);
	}
	$messages[0].scrollTop = $messages[0].scrollHeight;
    }

    // Prevents input from having injected markup
    function cleanInput (input) {
	return $('<div/>').text(input).text();
    }

    // Keyboard events

    $window.keydown(function (event) {
	// When the client hits ENTER on their keyboard
	if (event.which === 13) {
	    if (!username) {
		setUsername();
	    }
	}
    });

    // Socket events

    // Whenever the server emits 'login', log the login message
    socket.on('login', function (data) {
	connected = true;
	// Display the welcome message
	var message = "Welcome to Simstagram!";
	log(message, {
	    prepend: true
	});
    });

    // Whenever the server emits 'user joined', log it in the chat body
    socket.on('user joined', function (data) {
	log(data.username + ' joined');
    });

    // Whenever the server emits 'user left', log it in the chat body
    socket.on('user left', function (data) {
	log(data.username + ' left');
    });

    // Whenever the server emits 'image added', insert it into the body
    socket.on('image added', function(data) {
	
    });

    // When the server emits the token data, log it in the console
    socket.on('token received', function(data) {
	console.log(data);
    });
});
