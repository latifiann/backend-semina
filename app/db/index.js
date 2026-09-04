const mongoose = require("mongoose");
const { urlDb } = require("../config");

const connectDB = () => mongoose.connect(urlDb);

module.exports = {
  connectDB,
  connection: mongoose.connection,
};
