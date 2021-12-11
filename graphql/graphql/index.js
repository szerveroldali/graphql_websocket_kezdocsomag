const { graphqlHTTP } = require("express-graphql");
const { makeExecutableSchema } = require("@graphql-tools/schema");
const { readFileSync } = require("fs");
const { join: pathJoin } = require("path");
const { typeDefs: scalarsTypeDefs, resolvers: scalarsResolvers } = require("graphql-scalars");

const ourTypeDefs = readFileSync(pathJoin(__dirname, "./typedefs.gql")).toString();
const ourResolvers = require("./resolvers");

const executableSchema = makeExecutableSchema({
    typeDefs: [scalarsTypeDefs, ourTypeDefs],
    resolvers: [scalarsResolvers, ourResolvers],
});

module.exports = graphqlHTTP({
    schema: executableSchema,
    graphiql: {
        // Lehessen HTTP fejlécelemeket is küldeni a kéréssel
        headerEditorEnabled: true,
    },
});
