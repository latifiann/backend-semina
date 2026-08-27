const express = require("express");
const router = express();
const { signinCMS } = require("./controller");

router.post("/auth/signin", signinCMS);

module.exports = router;
