const faker = require("faker");
const Joi = require("joi");
//const { v4: uuidv4 } = require('uuid');
const validate = require("./validate");

// Socket.IO emit cheat sheet: https://socket.io/docs/v4/emit-cheatsheet/
// Joi dokumentáció, példák: https://joi.dev/api/?v=17.5.0#general-usage

let db = {
    // ...
};

module.exports = {
    db,
    events: (io) => {
        io.on("connection", (socket) => {
            // Ezeket töröld ki, mielőtt beadod a megoldást! Ez csak neked segítség:

            // console.log("Client connected");
            // console.log(socket);
            // Socket események: socket.on("esemény neve", feldolgozó fv)
            // Az első paraméter (data) egy JSON objektum, ami tartalmaz minden bejövő adatot, a második pedig az ack, a nyugtázó függvény
            socket.on("test", (data, ack) => {
                //console.log(data, ack);
                socket.emit("test-client", "uzenet a szerverrol");
                ack({
                    status: "ok",
                });
            });

            // Validate használata:
            // socket.on("esemény neve", validate(validációk, feldolgozó fv))
            socket.on(
                "number",
                validate(
                    // Validációk a data-ra vonatkozóan
                    Joi.object({
                        // A data.number egy integer kell, hogy legyen
                        number: Joi.number().integer().required(),
                    }),
                    // Feldolgozó fv
                    ({ number }, ack) => {
                        // Ha a validáció sikeres volt, visszaadjuk a nyugtázást, egyébként a validator wrapper generál egy errort és azt küldi vissza a kliensnek
                        ack({
                            number,
                            status: "ok",
                        });
                    }
                )
            );
        });
    },
};
