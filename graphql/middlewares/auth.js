const jwt = require("express-jwt");

module.exports = jwt({
    secret: process.env.JWT_SECRET || "secret",
    algorithms: [process.env.JWT_ALGO || "HS256"],
});
