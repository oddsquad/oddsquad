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
		socket.on('kick', alert);
		socket.on('auth', function() {
			console.log("joining");
			socket.emit('join', location.hash.substring(1));
		});
		socket.on('gamestart', function(data) {
			console.log(data);
		});
		window.sock = socket;
	}).catch(alert);
});
