require("dotenv").config();
const { createServer } = require("http");
const { Server } = require("socket.io");
const { instrument } = require("@socket.io/admin-ui");
let { db, events } = require("./events");
const AutoTester = require("./test/inject");

const httpServer = createServer();

const io = new Server(httpServer, {
    // Más erőforrásokból is el tudjuk érni a szervert, pl. ilyen a Sockcket.IO admin felülete,
    // ami ezen a domainen fut: admin.socket.io, de a localhost-on futó szerverünkre akarunk onnan
    // kapcsolódni
    cors: {
        origin: ["*"],
        credentials: true,
    },
    // Ez a beállítás lehetővé teszi a szerver elérését olyan kliensekkel is, amelyek csak a Socket.IO 2-es
    // verzióját támogatják (pl. Firecamp).
    allowEIO3: true,
});

// Inicializáljuk az admin felülethez szükséges szerveroldali logikát, és azon belül is
// kikapcsoljuk a hitelesítést
instrument(io, {
    auth: false,
});

// Az events megkapja az io referenciát
events(io);

// Automata tesztelő eseménykezelőjének hozzáadása
// FONTOS! Erre szükség van, hogy az automata tesztelő megfelelően tudja kezelni a végpontokat!
AutoTester.handleSocketIO(io, db);

// Elindítjuk a sima Node.js HTTP szervert, amin a Socket.io is fut
const port = process.env.PORT || 3000;
httpServer.listen(port, () => {
    console.log(`A Socket.IO szervere fut, ezen a porton: ${port}`);
    // FONTOS! Erre szükség van, hogy az automata tesztelő megfelelően tudjon inicializálni!
    AutoTester.handleStart();
});
