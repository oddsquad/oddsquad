var io = require('socket.io-client');
var util = require('./util');
console.log(io);
var socket = io();
socket.on('msg', function(msg) {
	console.log("MESSAGE FROM SERVER: "+msg);
	document.body.appendChild(document.createTextNode("Server says: "+msg));
});
