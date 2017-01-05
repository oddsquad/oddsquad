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
  return db.createTable("packs", {
    user_id: {
      type: "integer",
      notNull: true
    },
    pack_id: {
      type: "string",
      notNull: true
    },
    key: {
      type: "string",
      primaryKey: true
    },
    used: {
      type: "boolean",
      notNull: true,
      defaultValue: false
    }
  });
};

exports.down = function(db) {
  return db.dropTable("packs");
};

exports._meta = {
  "version": 1
};
