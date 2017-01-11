module.exports = function(res, data, util) {
	util.getUser().then(function(user) {
		data.db.any("SELECT name, id FROM deck WHERE user_id=${user}", {user: user}).then(function(results) {
			var tr = {};
			for(var i = 0; i < results.length; i++) {
				tr[results[i].id] = results[i].name;
			}
			util.die(200, JSON.stringify(tr), "application/json");
		}, util.fail);
	}, util.fail);
};
