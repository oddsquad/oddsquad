var http = require('http');
var Q = require('q');
var bcrypt = require('bcrypt-as-promised');
var pgp = require('pg-promise')({
	promiseLib: Q
});
var hat = require('hat');
var objects = require('./objects');
var fs = require('mz/fs');
var YAML = require('yamljs');
var wrap = require('word-wrap');
var cookies = require('cookies');
var twig = require('twig');
var multiparty = require('multiparty');

var fileServer = new (require('node-static').Server)('./static');

var PORT = process.env.PORT || 6300;
var DB_URL = process.env.DATABASE_URL;

var CARD_DATA = {};
var PACK_DATA = {};

var TWIG_VARS = {};

var db = pgp(DB_URL);

var loadCard = function(id) {
	if(id in CARD_DATA) {
		return Q.resolve(CARD_DATA[id].parsed);
	}
	else {
		return Q.reject("No such card");
	}
};
var loadPack = function(id) {
	if(id in PACK_DATA) {
		return Q.resolve(PACK_DATA[id].parsed);
	}
	else {
		return Q.reject("No such pack");
	}
};
var tspans = function(input) {
	var tr = "";
	var spl = input.split("\n");
	for(var i = 0; i < spl.length; i++) {
		var line = spl[i];
		tr += "<tspan x=\"0\" dy=\"1em\">"+line+"</tspan>";
	}
	return tr;
};

var handleWeb = function(req, res, POST, url) {
	var cookiejar = new cookies(req, res);
	if(!POST.token) {
		POST.token = cookiejar.get("os_token");
	}
	var die = function(status, text, type) {
		if(!type) type = "text/plain";
		if((type.indexOf("text/") === 0 || type === "application/json") && type.indexOf(";") === -1) {
			type = type+"; charset=utf-8";
		}
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
	var getUser = function(token) {
		if(!token) {
			token = POST.token;
		}
		if(!token) {
			// Still no token?  Reject it
			return Q.reject("Missing token");
		}
		return db.one("SELECT user_id FROM tokens WHERE id=${token}", {token: token}).then(function(result) {
			return result.user_id;
		})
		.catch(pgp.errors.QueryResultError, function(err) {
			if(err.code === pgp.errors.queryResultErrorCode.noData) {
				return "Invalid token";
			}
			return err;
		});
	};
	var data = {
		req: req,
		fields: POST,
		db: db,
		CARD_DATA: CARD_DATA
	};
	var util = {
		die: die,
		ensure: ensure,
		getUser: getUser,
		loadCard: loadCard,
		fail: function(err) {
			var msg = err+"";
			var code = 500;
			if(err instanceof pgp.errors.QueryResultError) {
				if(err.code === pgp.errors.queryResultErrorCode.noData) {
					msg = "No such object";
					code = 404;
				}
			}
			util.die(code, msg);
		},
		loadPack: loadPack
	};
	if(url.indexOf("/api") === 0) {
		var remains = url.substring(5);
		if(remains === "signup") {
			if(!ensure(POST.username, "Missing username") || !ensure(POST.password, "Missing password")) {
				return;
			}
			bcrypt.hash(POST.password).then(function(hash) {
				db.one("INSERT INTO users (name, passhash) VALUES (${name}, ${passhash}) RETURNING id", {name: POST.username, passhash: hash}).then(function(data) {
					die(200, "Success");
					db.none("INSERT INTO packs (user_id, pack_id, key) VALUES (${user}, 'starter', ${key})", {user: data.id, key: hat()}).catch(console.error);
				}, function(err) {
					if(err && err.code === "23505") {
						die(400, "A user by that name already exists");
						return;
					}
					die(500, err);
				});
			}, util.fail);
		}
		else if(remains === "login") {
			if(!ensure(POST.username, "Missing username") || !ensure(POST.password, "Missing password")) {
				return;
			}
			db.one("SELECT id, passhash FROM users WHERE name=${name}", {name:POST.username}).then(function(result) {
				var user = result.id;
				bcrypt.compare(POST.password, result.passhash).then(function() {
					var token = hat();
					db.none("INSERT INTO tokens (user_id, id, timestamp) VALUES (${user}, ${token}, localtimestamp)", {user: user, token: token}).then(function() {
						cookiejar.set('os_token', token, {maxAge: 5000000000});
						util.die(200, token);
					}, util.fail);
				})
				.catch(bcrypt.MISMATCH_ERROR, util.die.bind(util, 403, "Incorrect password"))
				.catch(util.fail);
			}, util.fail);
		}
		else if(remains === "user") {
			var promise;
			if("id" in POST) {
				promise = new Q(POST.id);
			}
			else {
				promise = getUser();
			}
			promise.then(function(user) {
				db.one("SELECT id, name FROM users WHERE id=${user}", {user: user})
				.then(function(result) {
					console.log(JSON.stringify(result));
					die(200, JSON.stringify(result), "application/json");
				}, util.fail);
			}, util.fail);
		}
		else if(remains === "cardArt") {
			if(!ensure(POST.id, "Card ID missing")) return;
			loadCard(POST.id).then(function(card) {
				fs.readFile("data/art/BASE_GUY.svg").then(function(content) {
					var tr = content+"";
					tr = tr.replace("{{NAME}}", card.name);
					tr = tr.replace("{{ATTACK_TSPANS}}", tspans(wrap(card.attackString()+"\n"+card.abilityString(), {width:25, indent:""})));
					tr = tr.replace("{{CARD_IMAGE}}", "/data/art/"+card.id+".svg");
					die(200, tr, "image/svg+xml");
				}, util.fail);
			}, util.fail);
		}
		else if(remains === "cardDebug") {
			if(!ensure(POST.id, "Card ID missing")) return;
			loadCard(POST.id).then(function(card) {
				card.abilityStr = card.abilityString();
				card.attackStr = card.attackString();
				die(200, JSON.stringify(card), "application/json");
			}, util.fail);
		}
		else {
			try {
				var page = require("./api/"+remains);
				page(res, data, util);
			} catch(e) {
				if(e.code === "MODULE_NOT_FOUND") {
					die(404, "Error 404");
				}
				else {
					console.error(e);
					die(500, "Error 500");
				}
			}
		}
	}
	else {
		fileServer.serve(req, res, function(err, result) {
			if(err) {
				if(err.status === 404) {
					var file = "./pages"+req.url+".twig";
					fs.readFile(file).then(function(content) {
						var template = twig.twig({
							data: content.toString()
						});
						console.log(template);
						return template.render(TWIG_VARS);
					})
					.then(function(content) {
						console.log(content);
						die(200, content, "text/html");
					})
					.catch(function(err) {
						if(err.errno === -2) {
							die(404, "Error 404");
							return;
						}
						console.error(err);
						die(500, "Error 500");
					});
				}
				else {
					res.writeHead(err.status, err.headers);
					res.write("Error "+err.status);
					res.end();
				}
			}
		});
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
});

console.log("Loading cards");
Q.all([
	fs.readdir(__dirname+"/data/cards").then(function(files) {
		console.log(files);
		return Q.all(files.map(function(file) {
			if(file.endsWith(".yml")) {
				return fs.readFile(__dirname+"/data/cards/"+file)
				.then(function(content) {
					var data = YAML.parse(content.toString());
					var id = file.substring(0, file.indexOf(".yml"));
					var ta = {};
					ta.rawData = data;
					ta.parsed = new objects.Guy(id, data);
					CARD_DATA[id] = ta;
				});
			}
			return Q.resolve();
		}));
	}),
	fs.readdir(__dirname+"/data/cardpacks").then(function(files) {
		console.log(files);
		return Q.all(files.map(function(file) {
			if(file.endsWith(".yml")) {
				return fs.readFile(__dirname+"/data/cardpacks/"+file)
				.then(function(content) {
					var data = YAML.parse(content.toString());
					var id = file.substring(0, file.indexOf(".yml"));
					var ta = {};
					ta.rawData = data;
					ta.parsed = new objects.Pack(data);
					PACK_DATA[id] = ta;
				});
			}
			return Q.resolve();
		}));
	}),
	fs.readdir(__dirname+"/includes").then(function(files) {
		return Q.all(files.map(function(file) {
			if(file.endsWith(".html")) {
				return fs.readFile(__dirname+"/includes/"+file)
				.then(function(content) {
					TWIG_VARS[file.substring(0, file.length-5)] = content.toString();
				});
			}
			return Q.resolve();
		}));
	})
]).then(function() {
	webserve.listen(PORT);
}, console.error);
