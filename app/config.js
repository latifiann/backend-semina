const dotenv = require("dotenv");
dotenv.config();

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET wajib diisi!");
}

module.exports = {
  urlDb: process.env.URL_MONGODB_DEV,
  jwtExpiration: "24h",
  jwtSecret: process.env.JWT_SECRET,
};
