var games = {};
var users = {};
module.exports = function(webserve, data) {
	var io = require('socket.io')(webserve);
	io.on('connection', function(socket) {
		var user;
		var token;

		function kick(state) {
			for(var i in games) {
				var ind = games[i].users.indexOf(token);
				if(ind > -1) {
					games[i].users.splice(ind, 1);
				}
			}
			if(socket) {
				if(state) {
					socket.emit('kick', state);
				}
				socket.disconnect();
			}
			delete users[token];
		}

		socket.emit("msg", "Welcome");
		socket.on('token', function(theToken) {
			if(theToken in users) {
				kick("error.alreadyin");
			}
			token = theToken;
			data.db.one("SELECT user_id FROM gametoken WHERE id=${token}", {token: token})
			.then(function(result) {
				user = result.user_id;
				users[token] = {
					socket: socket,
					id: user
				};
				socket.emit("auth", {
					success: true,
					user: user
				});
				socket.emit("msg", "Hi, user #"+user);
			}).catch(function(err) {
				console.error(err);
				kick("error.auth");
			});
		});
		socket.on('join', function(gameid) {
			if(!token) {
				socket.emit("error", "error.notoken");
				return;
			}
			if(!games[gameid]) {
				games[gameid] = {
					users: []
				};
			}
			if(games[gameid].users.length >= 2) {
				kick("error.gamefull");
				return;
			}
			games[gameid].users.push(token);
			socket.emit("join", gameid);
		});
		socket.on('disconnect', function() {
			kick();
		});
	});
};
function tick() {
	var time = new Date().getTime();
	for(var i in games) {
		var game = games[i];
		if(!game.ready) {
			if(game.users.length >= 2) {
				game.ready = time;
			}
		}
		else if(!game.data) {
			if(time - game.ready > 1000) {
				game.data = {};
				var data = {users: game.users};
				for(var x = 0; x < game.users.length; x++) {
					users[game.users[x]].socket.emit("gamestart", data);
				}
			}
		}
	}
}
setInterval(tick, 0);
