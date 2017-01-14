var Q = require('q');
module.exports = function(res, data, util) {
	var tr = {};
	data.db.one("SELECT name, user_id FROM deck WHERE id=${id}", {id: data.fields.id})
	.then(function(info) {
		tr.name = info.name;
		return util.getUser().then(function(user) {
			if(info.user_id != user) {
				return Q.reject("That's not your deck.");
			}
		});
	}).then(function() {
		return data.db.many("SELECT card FROM deck_cards WHERE deck=${id}", {id: data.fields.id});
	}).then(function(cards) {
		tr.cards = cards.map(function(elem){return elem.card});
		util.die(200, JSON.stringify(tr), "application/json");
	}).catch(util.fail);
};
