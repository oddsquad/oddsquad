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
		var callback = Q.defer();
		var obj = document.createElement('object');
		obj.className = classes;
		obj.onload = function() {
			callback.resolve(this);
		};
		obj.onerror = function(e) {
			console.log(e);
			callback.reject(e);
		}
		obj.data = url;
		container.appendChild(obj);
		return callback.promise;
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
	loadCard: function(id, container, className) {
		className = className || "";
		return Q.all([
			util.loadSVG("/api/cardArt?id="+id, container, className || ""),
			util.request("GET", "/api/rawCard?id="+id)
		])
			.then(function(data) {
				var info = JSON.parse(data[1]);
				data[0].contentDocument.getElementById('health').textContent = info.Health;
				return {obj: data[0], info: info};
			});
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
	alert(err);
});

util.waitFor("user")
.then(function(USER) {
	util.waitForWindowLoad()
	.then(function() {
		if(USER) {
			document.body.className = "loggedIn";
			var userTab = document.getElementById('userTab');
			userTab.textContent = USER.name;
			util.waitFor("coins")
			.then(function(coins) {
				var coinSpan = document.createElement('span');
				document.getElementById('coinTab').appendChild(coinSpan);
				coinSpan.appendChild(document.createTextNode(coins));
				var coinImg = document.createElement('img');
				coinImg.src = "/data/art/oddball.svg";
				coinImg.className = "coinImg";
				coinSpan.appendChild(coinImg);
			});
		}
		else {
			document.body.className = "notLoggedIn";
		}
	});
});


module.exports = util;
