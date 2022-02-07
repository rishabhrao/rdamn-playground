/* Copyright (c) rishabhrao (https://github.com/rishabhrao) */

import AjvJtd, { JTDSchemaType } from "ajv/dist/jtd"
import { watch as chokidarWatch } from "chokidar"
import type { FastifyInstance } from "fastify"
import type { SocketStream } from "fastify-websocket"

const ajvJtd: AjvJtd = new AjvJtd()

type FileWatchServerToClientEventType = {
	event: "add" | "addDir" | "change" | "unlink" | "unlinkDir"
	path: string
}

const FileWatchServerToClientEventSchema: JTDSchemaType<FileWatchServerToClientEventType> = {
	properties: {
		event: { enum: ["add", "addDir", "change", "unlink", "unlinkDir"] },
		path: { type: "string" },
	},
	additionalProperties: false,
}

const serializeFileWatchServerToClientEvent: (message: FileWatchServerToClientEventType) => string = ajvJtd.compileSerializer(FileWatchServerToClientEventSchema)

const fileWatchHandler: (server: FastifyInstance, connection: SocketStream) => void = (server: FastifyInstance, connection: SocketStream) => {
	try {
		const sendMessageToClient: (message: FileWatchServerToClientEventType) => void = (message: FileWatchServerToClientEventType) => {
			connection.socket.send(serializeFileWatchServerToClientEvent(message))
		}

		chokidarWatch("/home/rdamn/code", {
			ignoreInitial: true,
		}).on("all", (event, path) => {
			sendMessageToClient({ event, path })
		})
	} catch (error) {
		server.log.error(error)
	}
}

export default fileWatchHandler
