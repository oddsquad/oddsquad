module.exports = function(res, data, util) {
	util.getUser().then(function(user) {
		data.db.any("SELECT pack_id, key FROM packs WHERE user_id=${user} AND used=false", {user: user}).then(function(results) {
			var tr = {};
			for(var i = 0; i < results.length; i++) {
				tr[results[i].key] = results[i].pack_id;
			}
			util.die(200, JSON.stringify(tr), "application/json");
		}, util.fail);
	}, util.fail);
};
