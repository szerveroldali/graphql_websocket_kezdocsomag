const models = require("../models");
const { sequelize, User /* ... */ } = models;
const auth = require("./auth");

module.exports = {
    Query: {
        helloAuth: auth((parent, params, context) => `Hello ${context.user.name}!`),
    },
};
