require("dotenv").config();
const express = require("express");
require("express-async-errors");
const app = express();
const { StatusCodes, ReasonPhrases } = require("http-status-codes");
const fs = require("fs").promises;
const date = require("date-and-time");
const expressPlayground = require("graphql-playground-middleware-express").default;
const AutoTester = require("./test/inject");

app.use(express.json());

// Bejelentkezés, regisztráció
app.use("/auth", require("./routers/auth"));

// GraphQL végpont + GraphiQL felület
app.use("/graphql", require("./graphql"));

// GraphQL Playground felület
app.get("/playground", expressPlayground({ endpoint: "/graphql" }));

// Végső middleware a default error handler felülírásához, így az nem
// HTML kimenetet fog adni, hanem JSON objektumot, továbbá egy log fájlba
// is beleírja a hibákat.
app.use(async (err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }
    await fs.appendFile(
        "error.log",
        // prettier-ignore
        [
            `[${date.format(new Date(), "YYYY. MM. DD. HH:mm:ss")}]`,
            "Name: " + err.name,
            "Message: " + err.message,
            "Stack:\n" + err.stack,
        ]
        .join("\n") + "\n\n"
    );
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
        httpStatus: ReasonPhrases.INTERNAL_SERVER_ERROR,
        errorDetails: {
            name: err.name,
            message: err.message,
            stack: [...err.stack.split("\n")],
        },
    });
});

// App indítása a megadott porton
(async () => {
    const port = process.env.PORT || 4000;
    app.listen(port, () => {
        console.log(`Az Express app fut, ezen a porton: ${port}`);

        // FONTOS! Erre szükség van, hogy az automata tesztelő megfelelően tudjon inicializálni!
        // Ehhez a sorhoz ne nyúlj a munkád közben: hagyd legalul, ne vedd ki, ne kommenteld ki,
        // különben elrontod az automata tesztelő működését!
        AutoTester.handleStart();
    });
})();
