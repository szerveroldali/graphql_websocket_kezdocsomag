const auth = require("../middlewares/auth");

// Fv exportálása, ami paraméterként vár egy resolver fv-t (fn), amihez visszaad egy wrapper fv-t,
// ami elvégzi az autentikációt.
module.exports = (fn) => async (parent, params, context, info) => {
    await new Promise((resolve, reject) => {
        // Az express-jwt middleware meghívása, amelynek 3 paramétere van: req, res, next.
        // Ebből nekünk a req a fontos, mivel a JWT token az Authorization header-ben érkezik,
        // illetve a next fv hívódik meg a middleware után.
        auth(context.expressRequest, null, (error) => {
            // Ha hiba keletkezett, azt a next fv az első paraméterben megkapja. Ha ezt a hibát reject-eljük a bevárt
            // promise-on belül, akkor az await-tel bevárt promise maga is ezt az errort fogja dobni, amit a GQL keretrendszer
            // majd valahogyan lekezel (lényegében majd küld egy értelmes választ a kliensnek a keletkezett hibaüzenettel).
            //   https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await#promise_rejection
            if (error) reject(error);
            // Ha az express-jwt middleware nem jelzett hibát a next-nek, akkor feloldjuk a semmit, hogy befejeződjön a Promise.
            // Mivel az auth middleware referencia szerint kapta meg a context-et, ezért belerakta a dekódolt JWT payload-ot (lásd később).
            resolve();
        });
    });

    // Ha reject történt, akkor throw-olva lett a hiba, tehát nem jut el a vezérlés addig, ahol ez a komment van,
    // vagyis ezen a ponton már sikeresnek tekintjük az autentikációt.

    // Az Express kérésbe bekerült a dekódolt JWT payload, de az egyszerűség kedvéért rakjuk be közvetlenül a context-be is.
    context.user = context.expressRequest.user;

    // Eredeti resolver fv meghívása, azonban a context-ben már benne lesznek a JWT adatok (ami jellemzően a user).
    return fn(parent, params, context, info);
};
