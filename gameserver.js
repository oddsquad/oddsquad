module.exports = function(webserve) {
	var io = require('socket.io')(webserve);
	io.on('connection', function(socket) {
		socket.emit("msg", "Welcome");
	});
};
