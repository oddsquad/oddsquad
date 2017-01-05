var Q = require('q');
module.exports = function(res, data, util) {
	util.getUser().then(function(user) {
		data.db.one("UPDATE packs SET used=true WHERE key=${key} AND used=false AND user_id=${user} RETURNING pack_id", {key:data.fields.key, user: user}).then(function(result) {
			var pack_id = result.pack_id;
			console.log(result, pack_id);
			return util.loadPack(pack_id);
		})
		.then(function(pack) {
			console.log(pack);
			var cards = pack.resolve(data.CARD_DATA);
			console.log(cards);
			Q.all(cards.map(function(card) {
				return data.db.none("INSERT INTO collection (user_id, card_id, timestamp) VALUES (${user}, ${card}, localtimestamp)", {user: user, card: card});
			})).then(function() {
				util.die(200, JSON.stringify(cards), "application/json");
			}).catch(util.fail);
		}).catch(util.fail);
	}).catch(util.fail);
};
