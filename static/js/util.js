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
