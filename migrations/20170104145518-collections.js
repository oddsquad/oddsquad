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
  return db.createTable("collection", {
    user_id: {
      type: "integer",
      notNull: true
    },
    card_id: {
      type: "string",
      notNull: true
    },
    timestamp: {
      type: "timestamp",
      notNull: true
    }
  });
};

exports.down = function(db) {
  return db.dropTable("collection");
};

exports._meta = {
  "version": 1
};
