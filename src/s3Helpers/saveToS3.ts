/* Copyright (c) rishabhrao (https://github.com/rishabhrao) */

import { execSync } from "child_process"
import { readFileSync } from "fs"

import fetch from "node-fetch"

import { SIGNED_PUT_URL } from "../constants"

/**
 * A Helper Function to save data to s3 by using Signed S3 URLs from env
 *
 * @export
 * @returns {() => Promise<void>} A Promise that resolves when saved data to s3 Successfully
 */
const saveToS3: () => Promise<void> = async () => {
	/**
	 * Directories to ignore when creating zip file to store in s3
	 *
	 */
	const ignoredDirs: string[] = ["node_modules", ".git"]

	// Cleanup old savefiles if any and copy current data to the `rdamn-template-saved` folder
	execSync(`cd /home/rdamn && rm -rf ./rdamn-template-saved ./code.zip && mkdir ./rdamn-template-saved && cp -rf ./code/* ./rdamn-template-saved/`)

	// Create zip file with new code and store it as `code.zip`
	execSync(`cd /home/rdamn && zip -r -9 ./code.zip ./rdamn-template-saved -x ${ignoredDirs.map(dir => `*${dir}*`).join(" ")}`)

	const s3PutResponse = await fetch(SIGNED_PUT_URL, {
		method: "PUT",
		headers: {
			"Content-Type": "application/zip",
		},
		body: readFileSync(`/home/rdamn/code.zip`),
	})

	if (s3PutResponse.status !== 200) {
		throw new Error("Save to S3 Failed!")
	}

	// Cleanup
	execSync(`cd /home/rdamn && rm -rf ./rdamn-template-saved ./code.zip`)
}

export default saveToS3
