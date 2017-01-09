module.exports = function(res, data, util) {
	util.getUser().then(function(user) {
		data.db.any("SELECT SUM(delta) FROM coins WHERE user_id=${user}", {user: user}).then(function(results) {
			var tr = 0;
			if(results.length > 0) {
				tr = results[0].sum;
			}
			util.die(200, tr || 0);
		}, util.fail);
	}, util.fail);
};
