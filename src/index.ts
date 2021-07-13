import "reflect-metadata";
import express = require("express");
import { ApolloServer } from "apollo-server-express";
import {createConnection} from "typeorm";
import {User} from "./entity/User";
import { buildSchema } from "type-graphql";
import { UserResolver } from "./resolvers/UserResolver";

(async () => {
    const app = express();
    app.get('/', (req, res) => res.send("Hello world"))

    await createConnection();

    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [UserResolver]
        })
    });

    apolloServer.applyMiddleware({app})
    
    app.listen(4000, () => {
        console.log("express listening on " + 4000 + " port")
    })    
})()
