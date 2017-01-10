'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function(db) {
  return db.createTable("deck", {
    name: {
      type: "string",
      notNull: true
    },
    user_id: {
      type: "integer",
      notNull: true
    },
    id: {
      type: "serial",
      primaryKey: true
    }
  })
  .then(function() {
    return db.createTable("deck_cards", {
      deck: {
	type: "integer",
	notNull: true
      },
      card: {
	type: "string",
	notNull: true
      }
    });
  });
};

exports.down = function(db) {
  return db.dropTable("deck_cards").then(function() {
    return db.dropTable("deck");
  });
};

exports._meta = {
  "version": 1
};
