var util = require('./util');
require.ensure(['socket.io-client'], function() {
	var io = require('socket.io-client');
	var socket = io();
	socket.on('msg', function(msg) {
		console.log("MESSAGE FROM SERVER: "+msg);
		document.body.appendChild(document.createTextNode("Server says: "+msg));
	});
});
