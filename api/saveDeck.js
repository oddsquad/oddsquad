var Q = require('q');
var hat = require('hat');
module.exports = function(res, data, util) {
	var user;
	var deck;
	util.getUser().then(function(theUser) {
		user = theUser;
		if(data.fields.id) {
			return data.db.one("SELECT user_id FROM deck WHERE id=${id}", {id:data.fields.id})
				.then(function(deck) {
					if(deck.user_id == user) {
						return true;
					}
					return Q.reject("That's not your deck.");
				});
		}
		else if(!data.fields.name) {
			return Q.reject("Missing name");
		}
		return Q.resolve();
	})
	.then(function() {
		if(!data.fields.deck) {
			return Q.reject("Missing deck info");
		}
		deck = JSON.parse(data.fields.deck);
		return util.validateDeck(user, deck);
	})
	.then(function() {
		return data.db.none("BEGIN")
		.then(function() {
			if(!data.fields.id) {
				return data.db.one("INSERT INTO deck (user_id, name) VALUES (${user}, ${name}) RETURNING id", {user: user, name: data.fields.name})
				.then(function(data) {
					return data.id;
				});
			}
			if(data.fields.name) {
				return data.db.none("UPDATE deck SET name=${name} WHERE id=${deck}", {name: data.fields.name, deck: data.fields.id})
				.then(function() {
					return data.fields.id;
				});
			}
			return data.fields.id;
		})
		.then(function(id) {
			return Q.all([data.db.none("DELETE FROM deck_cards WHERE deck=${deck}", {deck: id})]
				.concat(deck.guys.map(function(elem) {
					return data.db.none("INSERT INTO deck_cards (card, deck) VALUES (${card}, ${deck})", {card: elem, deck: id});
				}))
				.concat((deck.items || []).map(function(elem) {
					return data.db.none("INSERT INTO deck_cards (card, deck) VALUES (${card}, ${deck})", {card: elem, deck: id});
				})));
		})
		.then(function() {
			return data.db.none("COMMIT");
		})
		.then(function() {
			util.die(200, "Success");
		})
		.catch(function(err) {
			data.db.none("ROLLBACK")
			.then(function() {
				util.fail(err);
			}).catch(util.fail);
		});
	})
	.catch(util.fail);
};
