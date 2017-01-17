module.exports = function(res, data, util) {
	var id = require('hat')();
	util.getUser()
	.then(function(user) {
		return data.db.none("INSERT INTO gametoken (user_id, id) VALUES (${user}, ${token})", {
			user: user,
			token: id
		});
	})
	.then(function() {
		util.die(200, id);
	})
	.catch(util.fail);
};
