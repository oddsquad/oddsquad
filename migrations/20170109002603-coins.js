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

exports.up = function(db, callback) {
  return db.createTable("coins", {
    user_id: {
      type: "integer",
      notNull: true
    },
    delta: {
      type: "integer",
      notNull: true
    },
    timestamp: {
      type: "timestamp",
      notNull: true
    },
    reason: {
      type: "string"
    }});
};

exports.down = function(db) {
  return db.dropTable("coins");
};

exports._meta = {
  "version": 1
};
