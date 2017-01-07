function loadSVG(url, container, classes) {
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
}

function getImagePromise(src, imgEl) {
	imgEl = imgEl || new Image();

	var tr = new Q(function(resolve, reject){
		imgEl.addEventListener('load', function(){
			if ((
				'naturalHeight' in this 
					&& this.naturalHeight + this.naturalWidth === 0
			) 
					|| (this.width + this.height == 0)) {
						reject(new Error('Image not loaded:' + this.src));
					} else {
						resolve(this);
					}
		});

		imgEl.addEventListener('error', function(){
			reject(new Error('Image not loaded:' + this.src));
		});
	});
	imgEl.src = src;
	imgEl.data = src;
	return tr;
}

function request(method, url, formData) {
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
}

var WINDOW_CALLBACKS = [];

var windowLoaded = false;

function waitForWindowLoad() {
	var callback = Q.defer();
	WINDOW_CALLBACKS.push(callback.resolve.bind(callback));
	if(windowLoaded) {
		callback.resolve();
	}
	return callback.promise;
}

window.addEventListener('load', function() {
	windowLoaded = true;
	WINDOW_CALLBACKS.map(function(e) {e();});
});


var CALLBACKS = {};

var completed = {};

function waitFor(type) {
	if(!(type in CALLBACKS)) {
		CALLBACKS[type] = [];
	}
	var callback = Q.defer();
	CALLBACKS[type].push(callback);
	if(type in completed) {
		callback.resolve(completed[type]);
	}
	return callback.promise;
}

function completeWaitee(type, value) {
	completed[type] = value;
	if(!(type in CALLBACKS)) return;
	CALLBACKS[type].forEach(function(elem) {
		elem.resolve(value);
	});
}

request("GET", "/api/user")
.then(function(res) {
	var j = JSON.parse(res);
	completeWaitee("user", j);
}).catch(function(err) {
	console.log(err);
	completeWaitee("user", null);
});

waitFor("user")
.then(function(USER) {
	waitForWindowLoad()
	.then(function() {
		if(USER) {
			document.body.className = "loggedIn";
			document.getElementById('userTab').textContent = USER.name;
		}
		else {
			document.body.className = "notLoggedIn";
		}
	});
});

var loadCard = function(id, container, className) {
	className = className || "";
	return Q.all([
		loadSVG("/api/cardArt?id="+id, container, className || ""),
		request("GET", "/api/rawCard?id="+id)
	])
		.then(function(data) {
			var info = JSON.parse(data[1]);
			data[0].contentDocument.getElementById('health').textContent = info.Health;
			return {obj: data[0], info: info};
		});
};
