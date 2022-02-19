/* Copyright (c) rishabhrao (https://github.com/rishabhrao) */

import fastify, { FastifyInstance } from "fastify"
import fastifyCors from "fastify-cors"
import fastifyWebsocket from "fastify-websocket"

import crudHandler from "./crudHandler"
import fileWatchHandler from "./fileWatchHandler"
import terminalHandler from "./terminalHandler"

export const server: FastifyInstance = fastify({
	logger: { level: "error" },
})

void server.register(fastifyCors, {
	origin: "*",
})

void server.register(fastifyWebsocket)

server.get("/", async (_req, res) => {
	await res.status(200).send("success")
})

server.get("/crud", { websocket: true }, connection => crudHandler(server, connection))

server.get("/filewatch", { websocket: true }, connection => fileWatchHandler(server, connection))

server.get("/terminal", { websocket: true }, connection => terminalHandler(server, connection))

const ServerTTL: number = process.env.NODE_ENV === "development" ? Math.pow(2, 31) - 1 : 15 * 1000 // 15 Seconds
let lastConnectedTime: number = Date.now()

server.get("/ttl", { websocket: true }, connection => {
	lastConnectedTime = Date.now()

	connection.socket.on("message", message => {
		if (message.toString() === "ping") {
			lastConnectedTime = Date.now()
		}
	})
})

setInterval(() => {
	if (Date.now() > lastConnectedTime + ServerTTL) {
		void server.close()
		throw new Error(`No connection since last ${ServerTTL / 1000} seconds. Shutting down...`)
	}
}, ServerTTL)

const CommunicationPort: number = parseInt(process.env.CommunicationPort || "1234")

server.listen(CommunicationPort, process.env.NODE_ENV === "development" ? "127.0.0.1" : "0.0.0.0", error => {
	if (error) {
		server.log.error(error?.message)
	}
})
