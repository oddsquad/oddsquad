var Q = require('q');

var WINDOW_CALLBACKS = [];
var windowLoaded = false;
window.addEventListener('load', function() {
	windowLoaded = true;
	WINDOW_CALLBACKS.map(function(e) {e();});
});

var CALLBACKS = {};
var completed = {};
function completeWaitee(type, value) {
	completed[type] = value;
	if(!(type in CALLBACKS)) return;
	CALLBACKS[type].forEach(function(elem) {
		elem.resolve(value);
	});
}

var util = {
	loadSVG: function(url, container, classes) {
		if(arguments.length < 3 || (!classes && typeof container === "string")) {
			classes = container;
			container = null;
		}
		if(!classes) classes = "";
		var svg = document.createElement('svg');
		if(container) container.appendChild(svg);
		var path = url.split('/');
		svg.className = classes;
		return util.request("GET", url)
		.then(function(res) {
			var newOutput = "";
			var remaining = res;
			while(true) {
				var ind = remaining.indexOf("xlink:href");
				if(ind < 0) {
					newOutput += remaining;
					break;
				}
				newOutput += remaining.substring(0, ind+12);
				remaining = remaining.substring(ind+12);
				var i2 = remaining.indexOf('"');
				var subURL = remaining.substring(0, i2);
				if(subURL[0] != "/" && subURL[0] != "#") {
					subURL = path.slice(0, -1).join("/")+"/"+subURL;
				}
				newOutput += subURL;
				remaining = remaining.substring(i2);
			}
			console.log(newOutput);
			svg.innerHTML = newOutput;
			return svg;
		});
	},
	request: function(method, url, formData) {
		return new Promise(function(resolve, reject) {
			var xhr = new XMLHttpRequest();
			xhr.open(method, url);
			xhr.onload = function() {
				if(this.status >= 200 && this.status < 300) {
					resolve(this.response);
				}
				else {
					reject(this.response);
				}
			};
			xhr.onerror = function() {
				reject(this.statusText);
			};
			xhr.send(formData);
		});
	},
	waitForWindowLoad: function() {
		var callback = Q.defer();
		WINDOW_CALLBACKS.push(callback.resolve.bind(callback));
		if(windowLoaded) {
			callback.resolve();
		}
		return callback.promise;
	},
	waitFor: function(type) {
		if(!(type in CALLBACKS)) {
			CALLBACKS[type] = [];
		}
		var callback = Q.defer();
		CALLBACKS[type].push(callback);
		if(type in completed) {
			callback.resolve(completed[type]);
		}
		return callback.promise;
	},
	loadCardInfo: function(id) {
		return util.request("GET", "/api/rawCard?id="+id)
		.then(JSON.parse);
	},
	loadCard: function(id, container, classes) {
		return Q.all([
			util.loadSVG("/api/cardArt?id="+id, container, classes),
			util.loadCardInfo(id)
		])
			.then(function(data) {
				var info = data[1];
				data[0].getElementsByClassName('health')[0].textContent = info.Health;
				return {obj: data[0], info: info};
			});
	},
	empty: function(elem) {
		elem.textContent = "";
	}
};


util.request("GET", "/api/user")
.then(function(res) {
	var j = JSON.parse(res);
	completeWaitee("user", j);
}).catch(function(err) {
	console.log(err);
	completeWaitee("user", null);
});

util.request("GET", "/api/myCoins")
.then(function(res) {
	completeWaitee("coins", res);
}).catch(function(err) {
	console.error(err);
});

util.request("GET", "/api/myPacks")
.then(function(res) {
	completeWaitee("packs", JSON.parse(res));
}).catch(function(err) {
	console.error(err);
});


util.waitFor("user")
.then(function(USER) {
	util.waitForWindowLoad()
	.then(function() {
		if(USER) {
			document.body.className = "loggedIn";
			var userTab = document.getElementById('userTab');
			userTab.textContent = USER.name;
			var caret = document.createElement('span');
			caret.textContent = "\u25BE";
			caret.className = "dropdownArrow";
			userTab.appendChild(caret);
			util.waitFor("coins")
			.then(function(coins) {
				var coinSpan = document.createElement('span');
				document.getElementById('coinTab').appendChild(coinSpan);
				coinSpan.appendChild(document.createTextNode(coins));
				var coinImg = document.createElement('img');
				coinImg.src = require('../data/art/oddball.svg');
				coinImg.className = "coinImg";
				coinSpan.appendChild(coinImg);
			});
			util.waitFor("packs")
			.then(function(packs) {
				var packSpan = document.createElement('span');
				document.getElementById('packTab').appendChild(packSpan);
				packSpan.appendChild(document.createTextNode(Object.keys(packs).length));
				var packImg = document.createElement('img');
				packImg.src = require("../data/art/packs/randomMI.svg");
				packImg.className = "packImg";
				packSpan.appendChild(packImg);
			});
		}
		else {
			document.body.className = "notLoggedIn";
		}
	});
});
util.waitForWindowLoad()
.then(function() {
	var navs = document.getElementsByClassName('navbar-nav');
	for(var i = 0; i < navs.length; i++) {
		var lis = navs[i].getElementsByTagName('li');
		for(var j = 0; j < lis.length; j++) {
			if(lis[j].getElementsByTagName('a')[0].href == location.href) {
				lis[j].className += " active";
			}
		}
	}
});

module.exports = util;
