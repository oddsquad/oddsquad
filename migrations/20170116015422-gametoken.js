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
  return db.createTable("gametoken", {
    user_id: {
      type: "int",
      notNull: true
    },
    id: {
      type: "string",
      primaryKey: true
    }
  });
};

exports.down = function(db) {
  return db.dropTable("gametoken");
};

exports._meta = {
  "version": 1
};
