module.exports = function(res, data, util) {
	data.db.none("DELETE FROM tokens WHERE id=${id}", {id: data.fields.token}).then(function() {
		data.cookiejar.set("os_token");
		util.die(200, "Success");
	}).catch(util.fail);
};
