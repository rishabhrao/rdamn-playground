/* Copyright (c) rishabhrao (https://github.com/rishabhrao) */

import fastify, { FastifyInstance } from "fastify"
import fastifyCors from "fastify-cors"
import fastifyWebsocket from "fastify-websocket"

import { CommunicationPort, NODE_ENV, SSL_CERT_FULLCHAIN, SSL_CERT_PRIVKEY } from "./constants"
import crudHandler from "./handlers/crudHandler"
import fileWatchHandler from "./handlers/fileWatchHandler"
import terminalHandler from "./handlers/terminalHandler"
import getFromS3 from "./s3Helpers/getFromS3"
import saveToS3 from "./s3Helpers/saveToS3"

getFromS3()

const serverOptions = {
	logger: { level: "error" },
	https:
		NODE_ENV === "development"
			? undefined
			: {
					cert: Buffer.from(SSL_CERT_FULLCHAIN, "base64").toString("ascii"),
					key: Buffer.from(SSL_CERT_PRIVKEY, "base64").toString("ascii"),
			  },
}

const server: FastifyInstance = fastify(serverOptions)

void server.register(fastifyCors, {
	origin: "*",
})

void server.register(fastifyWebsocket)

// Register HTTP endpoint at `/` to check if server is running
server.get("/", async (_req, res) => {
	await res.status(200).send("success")
})

// Register Websocket endpoint at `/crud` for CRUD Operations
server.get("/crud", { websocket: true }, connection => crudHandler(server, connection))

// Register Websocket endpoint at `/filewatch` to watch for file changes
server.get("/filewatch", { websocket: true }, connection => fileWatchHandler(server, connection))

// Register Websocket endpoint at `/terminal` for user pty
server.get("/terminal", { websocket: true }, connection => terminalHandler(server, connection))

/**
 * Time at which the server last received a connection
 *
 */
let lastConnectedTime: number = Date.now()

// Register Websocket endpoint at `/ttl` to update `lastConnectedTime` on every ping
server.get("/ttl", { websocket: true }, connection => {
	lastConnectedTime = Date.now()

	connection.socket.on("message", message => {
		if (message.toString() === "ping") {
			lastConnectedTime = Date.now()
		}
	})
})

/**
 * Time after which server shuts down
 *
 */
const ServerTTL: number = NODE_ENV === "development" ? Math.pow(2, 31) - 1 : 15 * 1000 // 15 Seconds

setInterval(() => {
	// Save data to s3 and shutdown server if no connection
	if (Date.now() > lastConnectedTime + ServerTTL) {
		void server.close()
		void (() => {
			if (NODE_ENV === "development") {
				return Promise.resolve()
			}

			return saveToS3()
		})().then(() => {
			throw new Error(`No connection since last ${ServerTTL / 1000} seconds. Shutting down...`)
		})
	}
}, ServerTTL)

// Listen for connections on `CommunicationPort`
server.listen(CommunicationPort, "0.0.0.0", error => {
	if (error) {
		server.log.error(error?.message)
	}
})
