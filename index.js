var http = require('http');
var bcrypt = require('bcrypt-nodejs');
var pg = require('pg');
var hat = require('hat');

var PORT = process.env.PORT || 6300;
var DB_URL = process.env.DATABASE_URL;

var db = new pg.Client(process.env.DATABASE_URL);
db.connect(function(err) {
	if(err) {
		console.error(err);
		process.exit();
	}
});

var handleWeb = function(req, res, POST, url) {
	var die = function(status, text, type) {
		if(!type) type = "text/plain";
		res.writeHead(status, {"Content-type": type});
		res.write(text+"");
		res.end();
		if(status === 500) {
			console.error(text);
		}
	};
	var ensure = function(condition, text, status) {
		if(!status) status = 400;
		if(condition) {
			return true;
		}
		else {
			die(status, text);
			return false;
		}
	};
	var getUser = function(token, callback) {
		if(arguments.length < 2) {
			callback = token;
			token = POST.token;
		}
		db.query("SELECT user_id FROM tokens WHERE id=$1", [token], function(err, result) {
			if(err) {
				callback(err);
				return;
			}
			if(result.rows.length < 1) {
				callback("No such token");
				return;
			}
			callback(null, result.rows[0].user_id);
		});
	};
	if(url.indexOf("/api") === 0) {
		var remains = url.substring(5);
		if(remains === "signup") {
			if(!ensure(POST.username, "Missing username") || !ensure(POST.password, "Missing password")) {
				return;
			}
			bcrypt.hash(POST.password, null, null, function(err, hash) {
				if(!ensure(!err, err, 500)) return;
				db.query("INSERT INTO users (name, passhash) VALUES ($1, $2)", [POST.username, hash], function(err, result) {
					if(err && err.code === "23505") {
						die(400, "A user by that name already exists");
						return;
					}
					if(!ensure(!err, err, 500)) return;
					die(200, "Success");
				});
			});
		}
		else if(remains === "login") {
			if(!ensure(POST.username, "Missing username") || !ensure(POST.password, "Missing password")) {
				return;
			}
			db.query("SELECT id, passhash FROM users WHERE name=$1", [POST.username], function(err, result) {
				if(!ensure(!err, err, 500)) return;
				if(!ensure(result.rows.length > 0, "Invalid username")) return;
				var user = result.rows[0].id;
				bcrypt.compare(POST.password, result.rows[0].passhash, function(err, result) {
					if(!ensure(result, "Incorrect password")) return;
					var token = hat();
					db.query("INSERT INTO tokens (user_id, id, timestamp) VALUES ($1, $2, localtimestamp)", [user, token], function(err, result) {
						if(!ensure(!err, err, 500)) return;
						die(200, token);
					});
				});
			});
		}
		else if(remains === "user") {
			(function(callback) {
				if("id" in POST) {
					callback(null, POST.id);
				}
				else {
					getUser(callback);
				}
			})(function(err, user) {
				if(!ensure(!err, err, 500)) return;
				db.query("SELECT id, name FROM users WHERE id=$1", [user], function(err, result) {
					if(!ensure(!err, err, 500)) return;
					if(!ensure(result.rows.length > 0, "No such user")) return;
					die(200, JSON.stringify(result.rows[0]), "application/json");
				});
			});
		}
		else {
			die(404, "Error 404");
		}
	}
	else {
		die(404, "Error 404");
	}
};
var webserve = http.createServer(function(req, res) {
	var POST = {};
	var hwr = handleWeb.bind(this, req, res, POST);
	console.log(req.url);
	var url = req.url;
	var ind = url.indexOf("?");
	if(ind > -1) {
		var newurl = url.substring(0, ind);
		var qsdata = require('querystring').parse(url.substring(ind+1));
		url = newurl;
		for(var key in qsdata) {
			POST[key] = qsdata[key];
		}
	}
	if (req.method === 'POST') {
		if(req.headers['content-type'].indexOf("multipart/form-data") === 0) {
			var form = new multiparty.Form();
			form.parse(req, function(err, fields) {
				for(var key in fields) {
					POST[key] = fields[key][0];
				}
				hwr(url);
			});
		}
		else {
			// not multipart
			req.on('data', function(data) {
				data = data.toString();
				data = data.split('&');
				for (var i = 0; i < data.length; i++) {
					var _data = data[i].split("=");
					POST[_data[0]] = _data[1];
				}
			});
			req.on('end', hwr.bind(this, url));
		}
	}
	else {
		hwr(url);
	}
}).listen(PORT);
