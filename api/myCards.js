module.exports = function(res, data, util) {
	util.getUser().then(function(user) {
		data.db.any("SELECT * FROM collection WHERE user_id=${user}", {user: user}).then(function(results) {
			util.die(200, JSON.stringify(results), "application/json");
		}, util.fail);
	}, util.fail);
};
