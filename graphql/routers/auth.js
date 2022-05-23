const express = require("express");
const router = express.Router();
const { StatusCodes } = require("http-status-codes");
const { User } = require("../models");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middlewares/auth");

// localhost:4000/auth/login
router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(StatusCodes.BAD_REQUEST).send({ message: "Nem adtál meg emailt vagy jelszót!" });
    }
    const user = await User.findOne({ where: { email } });
    if (!user) {
        return res.status(StatusCodes.NOT_FOUND).send({ message: "A megadott email címmel nem létezik felhasználó!" });
    }
    if (user.comparePassword(password)) {
        //return res.status(StatusCodes.OK).send({ message: "Sikeres bejelentkezés" });
        const token = jwt.sign(user.toJSON(), process.env.JWT_SECRET || "secret", { algorithm: process.env.JWT_ALGO || "HS256" });
        // Mivel létezik token nevű konstans, ezért a { token } egy rövidítés a { token: token } helyett:
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Object_initializer
        return res.send({ token }); // = res.send({ token: token });
    }
    return res.status(StatusCodes.UNAUTHORIZED).send({ message: "A megadott jelszó helytelen!" });
});

// localhost:4000/auth/who
// Ha érvényes a JWT token, akkor ez a végpont válaszban visszaadja a JWT token payload-ját (jwt.sign első paramétere)
// A JWT token ellenőrizhető a https://jwt.io/ oldalon.
router.get("/who", authMiddleware, async (req, res) => {
    //console.log(req.headers);
    res.send(req.user);
});

// localhost:4000/auth/register
router.post("/register", async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(StatusCodes.BAD_REQUEST).send({ message: "Nem adtál meg nevet, emailt vagy jelszót!" });
    }
    const user = await User.create({ name, email, password });
    // A regisztráció egyben egy bejelentkezés is, tehát egy tokent is aláírunk és elküldjük
    const token = jwt.sign(user.toJSON(), process.env.JWT_SECRET || "secret", { algorithm: process.env.JWT_ALGO || "HS256" });
    return res.status(StatusCodes.CREATED).send({ token });
});

module.exports = router;
