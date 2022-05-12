const { expressjwt: jwt } = require("express-jwt");

module.exports = jwt({
    secret: process.env.JWT_SECRET || "secret",
    algorithms: [process.env.JWT_ALGO || "HS256"],
    // Az express-jwt legújabb verziója alapértelmezés szerint a req.auth-ba rakja a dekódolt payload-ot,
    // ezt itt lehet visszaállítani a régebbi req.user-re:
    requestProperty: "user",
});
