const { readFileSync } = require("fs");
const { join: pathJoin } = require("path");
const { ApolloServer } = require("apollo-server-express");
const { ApolloServerPluginLandingPageGraphQLPlayground } = require("apollo-server-core");
const { typeDefs: scalarsTypeDefs, resolvers: scalarsResolvers } = require("graphql-scalars");

const apolloServerInstance = new ApolloServer({
    typeDefs: [scalarsTypeDefs, readFileSync(pathJoin(__dirname, "./typedefs.gql")).toString()],
    resolvers: [scalarsResolvers, require("./resolvers")],
    plugins: [ApolloServerPluginLandingPageGraphQLPlayground()],
});

module.exports = async (expressAppInstance) => {
    await apolloServerInstance.start();
    apolloServerInstance.applyMiddleware({ app: expressAppInstance, path: "/graphql" });
};
