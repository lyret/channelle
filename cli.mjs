import Path from 'node:path';
import { createConfiguration } from './_createConfiguration.mjs';
import { createClientBuildContext } from './_createClientBuildContext.mjs';
import { createServerBuildContext } from './_createServerBuildContext.mjs';

// ------------------------------------------
// On file execution
// ------------------------------------------

// Create the configuration
const config = await createConfiguration();

// Create build contexts
const serverContext = await createServerBuildContext(config);
const clientContext = await createClientBuildContext(config);

// Build both server and client once
if (process.env.BUILD == 'true') {
	try {
		console.log('[BUILD] Building server code');
		await serverContext.rebuild();
		await serverContext.dispose();
	} catch (err) {
		console.error('[BUILD] The server code is uncompliable');
		console.error(err);
	}
	try {
		console.log('[BUILD] Building client code');
		await clientContext.rebuild();
		await clientContext.dispose();
	} catch (err) {
		console.error('[BUILD] The client code is uncompliable');
		console.error(err);
	}
}
// Import and start the server directly
if (process.env.START == 'true') {
	try {
		import(Path.resolve(process.cwd(), config.build.serverOutput, 'index.js'));
	} catch (err) {
		console.error('[BUILD] Unable to execute the transpiled server side code');
		console.error(err);
	}
}

// ------------------------------------------
