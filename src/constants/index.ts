/* Copyright (c) rishabhrao (https://github.com/rishabhrao) */

import type { JSONSchemaType } from "ajv"
import envSchema from "env-schema"

type EnvConfigType = {
	NODE_ENV?: "development"
	SIGNED_GET_URL?: string
	SIGNED_PUT_URL?: string
	HOSTNAME: string
	CommunicationPort: string
	PreviewPort: string
	PreviewPort2: string
	SSL_CERT_FULLCHAIN: string
	SSL_CERT_PRIVKEY: string
}

const EnvConfigSchema: JSONSchemaType<EnvConfigType> = {
	type: "object",
	properties: {
		NODE_ENV: { type: "string", pattern: "^(development)$", nullable: true },
		SIGNED_GET_URL: { type: "string", minLength: 1, nullable: true },
		SIGNED_PUT_URL: { type: "string", minLength: 1, nullable: true },
		HOSTNAME: { type: "string", minLength: 1, default: `rdamn` },
		CommunicationPort: { type: "string", minLength: 1, default: `1234` },
		PreviewPort: { type: "string", minLength: 1, default: `1337` },
		PreviewPort2: { type: "string", minLength: 1, default: `1338` },
		SSL_CERT_FULLCHAIN: { type: "string", minLength: 1, nullable: true, default: "" },
		SSL_CERT_PRIVKEY: { type: "string", minLength: 1, nullable: true, default: "" },
	},
	required: ["HOSTNAME", "CommunicationPort", "PreviewPort", "PreviewPort2"],
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
		SSL_CERT_FULLCHAIN: process.env.SSL_CERT_FULLCHAIN,
		SSL_CERT_PRIVKEY: process.env.SSL_CERT_PRIVKEY,
	},
	schema: EnvConfigSchema,
})

export const { NODE_ENV, SIGNED_GET_URL, SIGNED_PUT_URL, HOSTNAME, CommunicationPort, PreviewPort, PreviewPort2, SSL_CERT_FULLCHAIN, SSL_CERT_PRIVKEY } = envConfig
