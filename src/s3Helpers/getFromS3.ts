/* Copyright (c) rishabhrao (https://github.com/rishabhrao) */

import { execSync } from "child_process"

import { CodeDir, NODE_ENV, SIGNED_GET_URL, UserDir } from "../constants"

/**
 * A Helper Function to get saved data from s3 by using Signed S3 URLs from env
 *
 * @export
 */
const getFromS3: () => void = () => {
	// Cleanup old data if any and create the `code` folder
	execSync(`cd ${UserDir} && rm -rf ./code && mkdir ./code && chmod 777 ./code`)

	if (NODE_ENV !== "development") {
		// Get saved data from s3 and save it as `code.zip`
		execSync(`runuser -u rdamn -- wget "${SIGNED_GET_URL || ""}" -O ${CodeDir}/code.zip`)

		// Unzip `code.zip` into the `code` folder
		execSync(`runuser -u rdamn -- unzip -d ${CodeDir} ${CodeDir}/code.zip`)

		// Flatten the top folders of the extracted zip file
		execSync(`runuser -u rdamn -- mv -f ${CodeDir}/rdamn-template-*/* ${CodeDir}/`)

		// Cleanup downloaded files
		execSync(`runuser -u rdamn -- rm -rf ${CodeDir}/code.zip ${CodeDir}/rdamn-template-*`)
	}
}

export default getFromS3
