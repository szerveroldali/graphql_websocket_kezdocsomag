const { readFileSync } = require("fs");
const { join: pathJoin } = require("path");
const { ApolloServer } = require("apollo-server-express");
const { ApolloServerPluginLandingPageGraphQLPlayground } = require("apollo-server-core");
const { typeDefs: scalarsTypeDefs, resolvers: scalarsResolvers } = require("graphql-scalars");

const apolloServerInstance = new ApolloServer({
    typeDefs: [scalarsTypeDefs, readFileSync(pathJoin(__dirname, "./typedefs.gql")).toString()],
    resolvers: [scalarsResolvers, require("./resolvers")],
    plugins: [ApolloServerPluginLandingPageGraphQLPlayground()],
    // Az alábbi dokumentációknak megfelelően fv-t adunk át az ApolloServer config-jában a context-nek,
    // ami - lévén, hogy az apollo-server-express csomagról van szó - megkapja paraméterként az Express-es
    // kérést és választ (req, res). Amit a fv visszaad, azt kapják meg a resolverben lévő fv-ek a context
    // paraméterben, vagyis mindegyik resolver fv megkap egy olyan contextet, aminek az expressRequest
    // property-jében ott van az Express-hez érkezett kérés, így pl. megoldható a hitelesítés.
    //   https://www.apollographql.com/docs/apollo-server/api/apollo-server#context
    //   https://www.apollographql.com/docs/apollo-server/api/apollo-server#middleware-specific-context-fields
    context: async ({ req }) => ({
        expressRequest: req,
    }),
});

module.exports = async (expressAppInstance) => {
    await apolloServerInstance.start();
    apolloServerInstance.applyMiddleware({ app: expressAppInstance, path: "/graphql" });
};
