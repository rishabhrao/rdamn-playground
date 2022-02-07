/* Copyright (c) rishabhrao (https://github.com/rishabhrao) */

import { EOL } from "os"

import AjvJtd, { JTDParser, JTDSchemaType } from "ajv/dist/jtd"
import type { FastifyInstance } from "fastify"
import type { SocketStream } from "fastify-websocket"
import { IPty, spawn as spawnNodePty } from "node-pty"

// Refer https://gist.github.com/abritinthebay/d80eb99b2726c83feb0d97eab95206c4
const reset = "\x1b[0m"
const bright = "\x1b[1m"
const red = "\x1b[31m"
const green = "\x1b[32m"
const blue = "\x1b[34m"
const BgWhite = "\x1b[47m"
const rdamnLogo = `
               ██████
              ██    ██
              ██    ██
              ██    ██
               ██████
            ██        ██
           ██   █████  ██
          ██    ██      ██
         ██     ██       ██
          ██    ██      ██
           ██          ██
            ██        ██
                ████
               ██  ██
              ██    ██
             ██      ██
            ██        ██
           ██          ██
          ██            ██
`

const ajvJtd: AjvJtd = new AjvJtd()

type TerminalClientToServerEventType = {
	ptyIn: string
}

const TerminalClientToServerEventSchema: JTDSchemaType<TerminalClientToServerEventType> = {
	properties: {
		ptyIn: { type: "string" },
	},
	additionalProperties: false,
}

const parseTerminalClientToServerEvent: JTDParser<TerminalClientToServerEventType> = ajvJtd.compileParser(TerminalClientToServerEventSchema)

type TerminalServerToClientEventType = {
	ptyOut: string
}

const TerminalServerToClientEventSchema: JTDSchemaType<TerminalServerToClientEventType> = {
	properties: {
		ptyOut: { type: "string" },
	},
	additionalProperties: false,
}

const serializeTerminalServerToClientEvent: (message: TerminalServerToClientEventType) => string = ajvJtd.compileSerializer(TerminalServerToClientEventSchema)

const terminalHandler: (server: FastifyInstance, connection: SocketStream) => void = (server: FastifyInstance, connection: SocketStream) => {
	try {
		const sendMessageToClient: (message: TerminalServerToClientEventType) => void = (message: TerminalServerToClientEventType) => {
			connection.socket.send(serializeTerminalServerToClientEvent(message))
		}

		const pty: IPty = spawnNodePty("bash", [], {
			name: "xterm-color",
			cwd: "/home/rdamn/code",
			env: process.env as { [key: string]: string } | undefined,
		})

		pty.write(`su rdamn${EOL}`)
		pty.write(`clear${EOL}`)

		sendMessageToClient({
			ptyOut: `${bright}${red}${rdamnLogo}${reset}${EOL}`,
		})

		sendMessageToClient({ ptyOut: `${BgWhite}${bright}${red}Connected! Welcome to rdamn!${reset}${EOL}${EOL}` })

		sendMessageToClient({ ptyOut: `${bright}${green}rdamn@rdamn${reset}:${blue}~/code${reset}$ ` })

		setTimeout(() => {
			pty.onData(data => {
				sendMessageToClient({ ptyOut: data })
			})
		}, 1000)

		pty.onExit(() => {
			connection.end()
		})

		connection.socket.on("message", message => {
			const parsedMessage = parseTerminalClientToServerEvent(message.toString())

			if (parsedMessage) {
				pty.write(parsedMessage.ptyIn)
			} else {
				sendMessageToClient({ ptyOut: `${EOL}Invalid Command${EOL}` })
			}
		})
	} catch (error) {
		server.log.error(error)
	}
}

export default terminalHandler
