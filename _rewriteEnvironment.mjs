import { readFileSync, writeFileSync } from "fs";

/**
 * Rewrites the environment file with the new show ID.
 */
async function rewriteEnvironment(newShowId) {
	try {
		// Read the .env file
		const envContent = readFileSync(".env", "utf-8");

		// Update the SHOW_ID in the .env content
		const updatedEnvContent = envContent.replace(/SHOW_ID\s*=\s*.*/g, `SHOW_ID = ${newShowId}`);

		// Write the updated content back to the .env file
		writeFileSync(".env", updatedEnvContent, "utf-8");

		console.log(`Successfully updated SHOW_ID to ${newShowId} in .env file.`);
		return true;
	} catch (error) {
		console.error("Error rewriting environment:", error.message);
		return false;
	}
}

export { rewriteEnvironment };
