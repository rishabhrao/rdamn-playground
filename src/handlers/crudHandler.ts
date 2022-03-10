/* Copyright (c) rishabhrao (https://github.com/rishabhrao) */

import { spawn as spawnChildProcess } from "child_process"
import { readFileSync, writeFileSync } from "fs"

import AjvJtd, { JTDParser, JTDSchemaType } from "ajv/dist/jtd"
import directoryTree from "directory-tree"
import type { FastifyInstance } from "fastify"
import type { SocketStream } from "fastify-websocket"

const ajvJtd: AjvJtd = new AjvJtd()

type CreateFolderCrudClientToServerEventType = {
	command: "createFolder"
	newFolderPath: string
}

const CreateFolderCrudClientToServerEventSchema: JTDSchemaType<Omit<CreateFolderCrudClientToServerEventType, "command">> = {
	properties: {
		newFolderPath: { type: "string" },
	},
	additionalProperties: false,
}

type CreateFileCrudClientToServerEventType = {
	command: "createFile"
	newFilePath: string
}

const CreateFileCrudClientToServerEventSchema: JTDSchemaType<Omit<CreateFileCrudClientToServerEventType, "command">> = {
	properties: {
		newFilePath: { type: "string" },
	},
	additionalProperties: false,
}

type UpdateFileCrudClientToServerEventType = {
	command: "updateFile"
	filePath: string
	fileContent: string
}

const UpdateFileCrudClientToServerEventSchema: JTDSchemaType<Omit<UpdateFileCrudClientToServerEventType, "command">> = {
	properties: {
		filePath: { type: "string" },
		fileContent: { type: "string" },
	},
	additionalProperties: false,
}

type ReadFolderCrudClientToServerEventType = {
	command: "readFolder"
	folderPath: string
}

const ReadFolderCrudClientToServerEventSchema: JTDSchemaType<Omit<ReadFolderCrudClientToServerEventType, "command">> = {
	properties: {
		folderPath: { type: "string" },
	},
	additionalProperties: false,
}

type ReadFileCrudClientToServerEventType = {
	command: "readFile"
	filePath: string
}

const ReadFileCrudClientToServerEventSchema: JTDSchemaType<Omit<ReadFileCrudClientToServerEventType, "command">> = {
	properties: {
		filePath: { type: "string" },
	},
	additionalProperties: false,
}

type MoveCrudClientToServerEventType = {
	command: "move"
	oldPath: string
	newPath: string
}

const MoveCrudClientToServerEventSchema: JTDSchemaType<Omit<MoveCrudClientToServerEventType, "command">> = {
	properties: {
		oldPath: { type: "string" },
		newPath: { type: "string" },
	},
	additionalProperties: false,
}

type DeleteCrudClientToServerEventType = {
	command: "delete"
	path: string
}

const DeleteCrudClientToServerEventSchema: JTDSchemaType<Omit<DeleteCrudClientToServerEventType, "command">> = {
	properties: {
		path: { type: "string" },
	},
	additionalProperties: false,
}

type CrudClientToServerEventType =
	| CreateFolderCrudClientToServerEventType
	| CreateFileCrudClientToServerEventType
	| UpdateFileCrudClientToServerEventType
	| ReadFolderCrudClientToServerEventType
	| ReadFileCrudClientToServerEventType
	| MoveCrudClientToServerEventType
	| DeleteCrudClientToServerEventType

const CrudClientToServerEventSchema: JTDSchemaType<CrudClientToServerEventType> = {
	discriminator: "command",
	mapping: {
		createFolder: CreateFolderCrudClientToServerEventSchema,
		createFile: CreateFileCrudClientToServerEventSchema,
		updateFile: UpdateFileCrudClientToServerEventSchema,
		readFolder: ReadFolderCrudClientToServerEventSchema,
		readFile: ReadFileCrudClientToServerEventSchema,
		move: MoveCrudClientToServerEventSchema,
		delete: DeleteCrudClientToServerEventSchema,
	},
}

const parseCrudClientToServerEvent: JTDParser<CrudClientToServerEventType> = ajvJtd.compileParser(CrudClientToServerEventSchema)

type ReadFolderCrudServerToClientEventType = {
	command: "readFolder"
	folderPath: string
	folderName: string
	folderContents: {
		type: "file" | "directory"
		path: string
		name: string
	}[]
}

const ReadFolderCrudServerToClientEventSchema: JTDSchemaType<Omit<ReadFolderCrudServerToClientEventType, "command">> = {
	properties: {
		folderPath: { type: "string" },
		folderName: { type: "string" },
		folderContents: {
			elements: {
				properties: {
					type: { enum: ["file", "directory"] },
					path: { type: "string" },
					name: { type: "string" },
				},
			},
		},
	},
	additionalProperties: false,
}

type ReadFileCrudServerToClientEventType = {
	command: "readFile"
	filePath: string
	fileContent: string
}

const ReadFileCrudServerToClientEventSchema: JTDSchemaType<Omit<ReadFileCrudServerToClientEventType, "command">> = {
	properties: {
		filePath: { type: "string" },
		fileContent: { type: "string" },
	},
	additionalProperties: false,
}

type CrudServerToClientEventType = ReadFolderCrudServerToClientEventType | ReadFileCrudServerToClientEventType

const CrudServerToClientEventSchema: JTDSchemaType<CrudServerToClientEventType> = {
	discriminator: "command",
	mapping: {
		readFolder: ReadFolderCrudServerToClientEventSchema,
		readFile: ReadFileCrudServerToClientEventSchema,
	},
}

const serializeCrudServerToClientEvent: (message: CrudServerToClientEventType) => string = ajvJtd.compileSerializer(CrudServerToClientEventSchema)

const crudHandler: (server: FastifyInstance, connection: SocketStream) => void = (server: FastifyInstance, connection: SocketStream) => {
	try {
		const sendMessageToClient: (message: CrudServerToClientEventType) => void = (message: CrudServerToClientEventType) => {
			connection.socket.send(serializeCrudServerToClientEvent(message))
		}

		const checkIsPathLegal: (path: string) => boolean = (path: string) => {
			return path.startsWith("/home/rdamn/code") && !path.includes("../") && !path.includes("/root")
		}

		connection.socket.on("message", message => {
			const parsedMessage = parseCrudClientToServerEvent(message.toString())

			if (parsedMessage) {
				switch (parsedMessage.command) {
					case "createFolder": {
						if (checkIsPathLegal(parsedMessage.newFolderPath)) {
							spawnChildProcess("mkdir", [parsedMessage.newFolderPath])
						}

						break
					}
					case "createFile": {
						if (checkIsPathLegal(parsedMessage.newFilePath)) {
							spawnChildProcess("touch", [parsedMessage.newFilePath])
						}

						break
					}
					case "updateFile": {
						try {
							if (checkIsPathLegal(parsedMessage.filePath)) {
								writeFileSync(parsedMessage.filePath, parsedMessage.fileContent)
							}
						} catch (error) {
							server.log.error(error)
						}

						break
					}
					case "readFolder": {
						if (checkIsPathLegal(parsedMessage.folderPath)) {
							const tree = directoryTree(parsedMessage.folderPath, { attributes: ["type"] } as directoryTree.DirectoryTreeOptions)

							sendMessageToClient({
								command: "readFolder",
								folderPath: tree?.path,
								folderName: tree?.name,
								folderContents: (tree?.children || [])?.map(({ type, path, name }) => ({ type, path, name })),
							})
						}

						break
					}
					case "readFile": {
						try {
							if (checkIsPathLegal(parsedMessage.filePath)) {
								const fileContent = readFileSync(parsedMessage.filePath, "utf8")
								sendMessageToClient({
									command: "readFile",
									filePath: parsedMessage.filePath,
									fileContent: fileContent,
								})
							}
						} catch (error) {
							server.log.error(error)
						}

						break
					}
					case "move": {
						if (checkIsPathLegal(parsedMessage.oldPath) && checkIsPathLegal(parsedMessage.newPath)) {
							spawnChildProcess("mv", ["-f", parsedMessage.oldPath, parsedMessage.newPath])
						}

						break
					}
					case "delete": {
						if (checkIsPathLegal(parsedMessage.path)) {
							spawnChildProcess("rm", ["-rf", parsedMessage.path])
						}

						break
					}
				}
			}
		})
	} catch (error) {
		server.log.error(error)
	}
}

export default crudHandler
