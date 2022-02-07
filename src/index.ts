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

const CommunicationPort: number = parseInt(process.env.CommunicationPort || "1234")

server.listen(CommunicationPort, process.env.NODE_ENV === "development" ? "127.0.0.1" : "0.0.0.0", error => {
	if (error) {
		server.log.error(error?.message)
	}
})
