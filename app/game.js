var util = require('./util');
require.ensure(['socket.io-client'], function() {
	util.request("GET", "/api/gameToken").then(function(token) {
		var io = require('socket.io-client');
		var socket = io();
		socket.emit('token', token);
		socket.on('msg', function(msg) {
			console.log("MESSAGE FROM SERVER: "+msg);
			document.body.appendChild(document.createTextNode("Server says: "+msg));
			document.body.appendChild(document.createElement('br'));
		});
		window.sock = socket;
	});
});
