const mongoose = require("mongoose");

const { urlDb } = require("../config.js");

mongoose.connect(urlDb);

const db = mongoose.connection;

module.exports = db;
