const { sequelize, User /* ... további modellek importálása itt */ } = require("../models");
const auth = require("./auth");

module.exports = {
    Query: {
        // * Elemi Hello World! példa:
        helloWorld: () => "Hello World!",

        // * Példa paraméterezésre:
        helloName: (_, { name }) => `Hello ${name}!`,

        /*
        * Példa hitelesítésre: auth(resolver függvény), vagyis a resolver függvényed "köré kell írni", hogy auth().
        * A JWT token payload-ja a context.user-be fog kerülni. A JWT token ellenőrizhető a https://jwt.io/ oldalon.

        * Bejelentkezéshez küldj egy POST kérést a http://localhost:4000/auth/login végpontra az alábbi request body szerint:
            {
                "email": "user1@szerveroldali.hu",
                "password": "password"
            }

        * Sikeres login esetén a válaszban visszakapod a szerver által aláírt tokent:
            {
                "token": "ey..."
            }

        * A GraphQL Playground felületén (http://127.0.0.1:4000/graphql) a bal oldali panel alján válaszd ki a "HTTP Headers"
        * részt, majd pedig az alábbi kód beszúrásával állítsd be, hogy a GraphQL kéréssel együtt elküldje a hitelesítésre
        * szolgáló fejlécet is:
            {
                "Authorization": "Bearer <MÁSOLD IDE A TOKENT>"
            }
        */
        helloAuth: auth((parent, params, context) => `Hello ${context.user.name}!`),
    },
};
