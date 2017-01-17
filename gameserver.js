module.exports = function(webserve, data) {
	var io = require('socket.io')(webserve);
	io.on('connection', function(socket) {
		var user;
		socket.emit("msg", "Welcome");
		socket.on('token', function(token) {
			data.db.one("SELECT user_id FROM gametoken WHERE id=${token}", {token: token})
			.then(function(result) {
				user = result.user_id;
				socket.emit("auth", {
					success: true,
					user: user
				});
				socket.emit("msg", "Hi, user #"+user);
			}).catch(function(err) {
				console.error(err);
				socket.emit("auth", {
					success: false,
					reason: "error"
				});
			});
		});
	});
};
