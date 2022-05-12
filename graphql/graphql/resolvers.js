const models = require("../models");
const { sequelize, User /* ... */ } = models;
const auth = require("./auth");

module.exports = {
    Query: {
        // Elemi példa:
        helloWorld: () => "Hello World!",

        // Példa paraméterezésre:
        helloName: (_, { name }) => `Hello ${name}!`,

        // Példa hitelesítésre:
        helloAuth: auth((parent, params, context) => `Hello ${context.user.name}!`),
    },
};
