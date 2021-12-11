module.exports = (schema, fn) => {
    // Deep copy a fv-ről
    const fnOriginal = fn.bind({});
    // Fv kibővítése a validálással, majd az eredeti fv meghívása a bővítetten belül
    fn = async (data, ack) => {
        try {
            const result = schema.validate(data);
            if (result.hasOwnProperty("error")) {
                // Error details logolása, pl. custom hibaüzenetekhez
                //console.log(result.error);
                throw result.error;
            }
            return await fnOriginal(data, ack);
            // Automatikus { status: "error", "message": <hibaüzenet> } válasz generálása hiba esetén
        } catch (error) {
            ack({
                status: "error",
                message: error.message,
            });
        }
    };
    // Kibővített fv visszaadása
    return fn;
};
