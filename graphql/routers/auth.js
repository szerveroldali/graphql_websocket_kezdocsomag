const express = require("express");
const router = express.Router();
const models = require("../models");
const jwt = require("jsonwebtoken");
const auth = require("../middlewares/auth");

const { User } = models;

// localhost:4000/auth/login
router.post("/login", async function (req, res) {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).send({ message: "Nem adtál meg emailt vagy jelszót!" });
    }
    const user = await User.findOne({ where: { email } });
    if (!user) {
        return res.status(404).send({ message: "A megadott email címmel nem létezik felhasználó!" });
    }
    if (user.comparePassword(password)) {
        //return res.status(200).send({ message: "Sikeres bejelentkezés" });
        const token = jwt.sign(user.toJSON(), "secret", { algorithm: "HS256" });
        return res.send({ token }); // = res.send({ token: token });
    }
    return res.status(401).send({ message: "A megadott jelszó helytelen!" });
});

// localhost:4000/auth/who
router.get("/who", auth, async function (req, res) {
    //console.log(req.headers);
    res.send(req.user);
});

// localhost:4000/auth/register
router.post("/register", async function (req, res) {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).send({ message: "Nem adtál meg nevet, emailt vagy jelszót!" });
    }
    const user = await User.create({ name, email, password });
    // A regisztráció egyben egy bejelentkezés is, tehát egy tokent is aláírunk és elküldjük
    const token = jwt.sign(user.toJSON(), "secret", { algorithm: "HS256" });
    return res.status(201).send({ token });
});

module.exports = router;
