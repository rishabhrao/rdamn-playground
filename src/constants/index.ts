/* Copyright (c) rishabhrao (https://github.com/rishabhrao) */

import type { JSONSchemaType } from "ajv"
import envSchema from "env-schema"

type EnvConfigType = {
	NODE_ENV?: "development"
	SIGNED_GET_URL: string
	SIGNED_PUT_URL: string
	HOSTNAME: string
	CommunicationPort: string
	PreviewPort: string
	PreviewPort2: string
}

const EnvConfigSchema: JSONSchemaType<EnvConfigType> = {
	type: "object",
	properties: {
		NODE_ENV: { type: "string", pattern: "^(development)$", nullable: true },
		SIGNED_GET_URL: { type: "string", minLength: 1 },
		SIGNED_PUT_URL: { type: "string", minLength: 1 },
		HOSTNAME: { type: "string", minLength: 1, default: `rdamn` },
		CommunicationPort: { type: "string", minLength: 1, default: `1234` },
		PreviewPort: { type: "string", minLength: 1, default: `1337` },
		PreviewPort2: { type: "string", minLength: 1, default: `1338` },
	},
	required: ["SIGNED_GET_URL", "SIGNED_PUT_URL", "HOSTNAME", "CommunicationPort", "PreviewPort", "PreviewPort2"],
	additionalProperties: false,
}

const envConfig: EnvConfigType = envSchema({
	data: {
		NODE_ENV: process.env.NODE_ENV,
		SIGNED_GET_URL: process.env.SIGNED_GET_URL,
		SIGNED_PUT_URL: process.env.SIGNED_PUT_URL,
		HOSTNAME: process.env.HOSTNAME,
		CommunicationPort: process.env.CommunicationPort,
		PreviewPort: process.env.PreviewPort,
		PreviewPort2: process.env.PreviewPort2,
	},
	schema: EnvConfigSchema,
})

export const { NODE_ENV, SIGNED_GET_URL, SIGNED_PUT_URL, HOSTNAME, CommunicationPort, PreviewPort, PreviewPort2 } = envConfig
