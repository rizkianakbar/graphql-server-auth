import { verify } from 'jsonwebtoken';
import 'dotenv/config';
import 'reflect-metadata';
import express = require('express');
import { ApolloServer } from 'apollo-server-express';
import { createConnection } from 'typeorm';
import { User } from './entity/User';
import { buildSchema } from 'type-graphql';
import { UserResolver } from './resolvers/UserResolver';
import cookieParser = require('cookie-parser');
import { createAccessToken, createRefreshToken } from './auth';
import { sendRefreshToken } from './sendRefreshToken';

(async () => {
	const app = express();
	app.use(cookieParser());

	app.get('/', (req, res) => res.send('Hello world'));

	app.post('/refresh_token', async (req, res) => {
		const token = req.cookies.jid;
		if (!token) {
			return res.send({ ok: false, accessToken: '' });
		}

		let payload = null;
		try {
			payload = verify(token, process.env.REFRESH_TOKEN_SECRET);
		} catch (err) {
			console.log(err);
			return res.send({ ok: false, accessToken: '' });
		}

		const user = await User.findOne({ id: payload.userId });
		if (!user) {
			return res.send({ ok: false, accessToken: '' });
		}

		if (user.tokenVersion !== payload.tokenVersion) {
			return res.send({ ok: false, accessToken: '' });
		}

		sendRefreshToken(res, createRefreshToken(user));

		return res.send({ ok: true, accessToken: createAccessToken(user) });
	});

	await createConnection();

	const apolloServer = new ApolloServer({
		schema: await buildSchema({
			resolvers: [UserResolver],
		}),
		context: ({ req, res }) => ({ req, res }),
	});

	apolloServer.applyMiddleware({ app });

	app.listen(4000, () => {
		console.log('express listening on ' + 4000 + ' port');
	});
})();
