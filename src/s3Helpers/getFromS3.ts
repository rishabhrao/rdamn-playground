/* Copyright (c) rishabhrao (https://github.com/rishabhrao) */

import { execSync } from "child_process"

import { SIGNED_GET_URL } from "../constants"

/**
 * A Helper Function to get saved data from s3 by using Signed S3 URLs from env
 *
 * @export
 */
const getFromS3: () => void = () => {
	// Cleanup old data if any and create the `code` folder
	execSync(`cd /home/rdamn && rm -rf ./code && runuser -u rdamn -- mkdir /home/rdamn/code`)

	// Get saved data from s3 and save it as `code.zip`
	execSync(`runuser -u rdamn -- wget "${SIGNED_GET_URL}" -O /home/rdamn/code/code.zip`)

	// Unzip `code.zip` into the `code` folder
	execSync(`runuser -u rdamn -- unzip -d /home/rdamn/code /home/rdamn/code/code.zip`)

	// Flatten the top folders of the extracted zip file
	execSync(`runuser -u rdamn -- mv -f /home/rdamn/code/rdamn-template-*/* /home/rdamn/code/`)

	// Cleanup downloaded files
	execSync(`runuser -u rdamn -- rm -rf /home/rdamn/code/code.zip /home/rdamn/code/rdamn-template-*`)
}

export default getFromS3
