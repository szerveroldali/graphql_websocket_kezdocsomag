const auth = require("../middlewares/auth");

module.exports = (fn) => async (parent, params, context, info) => {
    await new Promise((resolve, reject) => {
        auth(context, null, (error) => {
            if (error) reject(error);
            resolve();
        });
    });
    return fn(parent, params, context, info);
};
